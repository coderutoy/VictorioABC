-- ============================================================================
-- Victorio ABC — Migration 003: Triggers, Inventory Deduction & Atomic RPCs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_bite_cases_updated_at BEFORE UPDATE ON public.bite_cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_pep_schedules_updated_at BEFORE UPDATE ON public.pep_schedules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_vaccine_inventory_updated_at BEFORE UPDATE ON public.vaccine_inventory
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_stock_transfers_updated_at BEFORE UPDATE ON public.stock_transfers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_educational_content_updated_at BEFORE UPDATE ON public.educational_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-Create Profile on Auth Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.user_role;
  v_branch_id UUID;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'patient');
  v_branch_id := NULLIF(NEW.raw_user_meta_data->>'branch_id', '')::UUID;

  INSERT INTO public.profiles (id, branch_id, role, full_name, phone, email)
  VALUES (
    NEW.id,
    CASE WHEN v_role IN ('nurse', 'doctor') THEN v_branch_id ELSE NULL END,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unnamed User'),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Immutable Audit Logs Guard
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is immutable: % operations are prohibited.', TG_OP;
END;
$$;

CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- Automatic HITL AI Validation / Override Audit Trigger
CREATE OR REPLACE FUNCTION public.fn_audit_hitl_validation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.doctor_validated_category IS NOT NULL
     AND (OLD.doctor_validated_category IS DISTINCT FROM NEW.doctor_validated_category) THEN

    NEW.validated_at := COALESCE(NEW.validated_at, NOW());

    INSERT INTO public.audit_logs (branch_id, actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.branch_id,
      NEW.doctor_id,
      CASE
        WHEN NEW.ai_suggested_category IS NOT NULL
             AND NEW.ai_suggested_category <> NEW.doctor_validated_category
        THEN 'AI_CATEGORY_OVERRIDDEN'
        ELSE 'AI_CATEGORY_VALIDATED'
      END,
      'bite_cases',
      NEW.id,
      jsonb_build_object(
        'ai_suggested_category', NEW.ai_suggested_category,
        'ai_confidence', NEW.ai_confidence,
        'doctor_validated_category', NEW.doctor_validated_category,
        'override_reason', NEW.ai_override_reason
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bite_cases_hitl_audit
  BEFORE UPDATE ON public.bite_cases
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_hitl_validation();

-- Atomic Single-Batch Deduction Helper
CREATE OR REPLACE FUNCTION public.deduct_single_batch(
  p_batch_id UUID,
  p_expected_branch_id UUID,
  p_qty INTEGER
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inv RECORD;
BEGIN
  SELECT id, branch_id, vaccine_name, batch_number, quantity_remaining, expiration_date
  INTO v_inv
  FROM public.vaccine_inventory
  WHERE id = p_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory batch % not found.', p_batch_id;
  END IF;
  IF v_inv.branch_id IS DISTINCT FROM p_expected_branch_id THEN
    RAISE EXCEPTION 'Tenant violation: batch % does not belong to administering branch %.', p_batch_id, p_expected_branch_id;
  END IF;
  IF v_inv.expiration_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot administer expired batch % (expired on %).', v_inv.batch_number, v_inv.expiration_date;
  END IF;
  IF v_inv.quantity_remaining < p_qty THEN
    RAISE EXCEPTION 'Insufficient stock for % (batch %): % remaining, % required.',
      v_inv.vaccine_name, v_inv.batch_number, v_inv.quantity_remaining, p_qty;
  END IF;

  UPDATE public.vaccine_inventory
  SET quantity_remaining = quantity_remaining - p_qty, updated_at = NOW()
  WHERE id = p_batch_id;
END;
$$;

-- Inventory Auto-Deduction Trigger on PEP Dose Completion
CREATE OR REPLACE FUNCTION public.fn_deduct_inventory_on_dose()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW.status <> 'completed' THEN
    RAISE EXCEPTION 'Completed PEP doses cannot be reverted directly; contact Central Admin.';
  END IF;

  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM public.deduct_single_batch(NEW.inventory_batch_id, NEW.administered_branch_id, NEW.doses_deducted);

    IF NEW.erig_inventory_batch_id IS NOT NULL THEN
      PERFORM public.deduct_single_batch(NEW.erig_inventory_batch_id, NEW.administered_branch_id, 1);
    END IF;
    IF NEW.tetanus_inventory_batch_id IS NOT NULL THEN
      PERFORM public.deduct_single_batch(NEW.tetanus_inventory_batch_id, NEW.administered_branch_id, 1);
    END IF;

    INSERT INTO public.audit_logs (branch_id, actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.administered_branch_id,
      NEW.nurse_id,
      'DOSE_ADMINISTERED_STOCK_DEDUCTED',
      'pep_schedules',
      NEW.id,
      jsonb_build_object(
        'case_id', NEW.case_id,
        'dose_number', NEW.dose_number,
        'originating_branch_id', NEW.branch_id,
        'administered_branch_id', NEW.administered_branch_id,
        'inventory_batch_id', NEW.inventory_batch_id,
        'erig_inventory_batch_id', NEW.erig_inventory_batch_id,
        'tetanus_inventory_batch_id', NEW.tetanus_inventory_batch_id,
        'doses_deducted', NEW.doses_deducted
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pep_schedules_deduct_inventory
  AFTER UPDATE ON public.pep_schedules
  FOR EACH ROW EXECUTE FUNCTION public.fn_deduct_inventory_on_dose();

-- Atomic Stock Transfer RPC Step A: Admin Approve/Reject
CREATE OR REPLACE FUNCTION public.rpc_review_stock_transfer(
  p_transfer_id UUID,
  p_decision TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_transfer RECORD;
  v_source RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Only Central Admin can review stock transfers.';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision: must be approved or rejected.';
  END IF;

  SELECT * INTO v_transfer FROM public.stock_transfers WHERE id = p_transfer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock transfer % not found.', p_transfer_id; END IF;
  IF v_transfer.status <> 'pending' THEN
    RAISE EXCEPTION 'Transfer % is already % and cannot be reviewed.', p_transfer_id, v_transfer.status;
  END IF;

  IF p_decision = 'rejected' THEN
    UPDATE public.stock_transfers
    SET status = 'rejected', approved_by = auth.uid(), approved_at = NOW(), notes = COALESCE(p_notes, notes)
    WHERE id = p_transfer_id;

    INSERT INTO public.audit_logs (branch_id, actor_id, action, entity_type, entity_id, metadata)
    VALUES (v_transfer.to_branch_id, auth.uid(), 'STOCK_TRANSFER_REJECTED', 'stock_transfers', p_transfer_id, jsonb_build_object('notes', p_notes));

    RETURN jsonb_build_object('transfer_id', p_transfer_id, 'status', 'rejected');
  END IF;

  SELECT * INTO v_source FROM public.vaccine_inventory WHERE id = v_transfer.inventory_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Source inventory batch % not found.', v_transfer.inventory_id; END IF;
  IF v_source.branch_id IS DISTINCT FROM v_transfer.from_branch_id THEN
    RAISE EXCEPTION 'Source inventory batch does not match transfer from_branch_id.';
  END IF;
  IF v_source.expiration_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot transfer expired batch %.', v_source.batch_number;
  END IF;
  IF v_source.quantity_remaining < v_transfer.quantity THEN
    RAISE EXCEPTION 'Insufficient source stock: % available, % requested.', v_source.quantity_remaining, v_transfer.quantity;
  END IF;

  UPDATE public.vaccine_inventory SET quantity_remaining = quantity_remaining - v_transfer.quantity WHERE id = v_source.id;
  UPDATE public.stock_transfers
  SET status = 'approved', approved_by = auth.uid(), approved_at = NOW(), notes = COALESCE(p_notes, notes)
  WHERE id = p_transfer_id;

  INSERT INTO public.audit_logs (branch_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_transfer.to_branch_id, auth.uid(), 'STOCK_TRANSFER_APPROVED', 'stock_transfers', p_transfer_id,
    jsonb_build_object('from_branch_id', v_transfer.from_branch_id, 'to_branch_id', v_transfer.to_branch_id, 'batch_number', v_source.batch_number, 'quantity', v_transfer.quantity)
  );

  RETURN jsonb_build_object('transfer_id', p_transfer_id, 'status', 'approved', 'quantity_dispatched', v_transfer.quantity);
END;
$$;

-- Atomic Stock Transfer RPC Step B: Destination Nurse/Admin Receive
CREATE OR REPLACE FUNCTION public.rpc_receive_stock_transfer(p_transfer_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_transfer RECORD;
  v_source RECORD;
  v_dest_inventory_id UUID;
BEGIN
  SELECT * INTO v_transfer FROM public.stock_transfers WHERE id = p_transfer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock transfer % not found.', p_transfer_id; END IF;

  IF NOT (public.is_admin() OR (public.get_my_role() = 'nurse' AND public.get_my_branch_id() = v_transfer.to_branch_id)) THEN
    RAISE EXCEPTION 'Forbidden: Only destination branch nurses or Central Admin can receive this transfer.';
  END IF;
  IF v_transfer.status <> 'approved' THEN
    RAISE EXCEPTION 'Transfer % must be approved before receiving (current status: %).', p_transfer_id, v_transfer.status;
  END IF;

  SELECT * INTO v_source FROM public.vaccine_inventory WHERE id = v_transfer.inventory_id;

  INSERT INTO public.vaccine_inventory (
    branch_id, item_type, vaccine_name, batch_number, lot_number,
    quantity_remaining, low_stock_threshold, expiration_date
  )
  VALUES (
    v_transfer.to_branch_id, v_source.item_type, v_source.vaccine_name,
    v_source.batch_number, v_source.lot_number, v_transfer.quantity,
    v_source.low_stock_threshold, v_source.expiration_date
  )
  ON CONFLICT ON CONSTRAINT uq_inventory_branch_batch
  DO UPDATE SET
    quantity_remaining = public.vaccine_inventory.quantity_remaining + EXCLUDED.quantity_remaining,
    updated_at = NOW()
  RETURNING id INTO v_dest_inventory_id;

  UPDATE public.stock_transfers SET status = 'received', received_by = auth.uid(), received_at = NOW() WHERE id = p_transfer_id;

  INSERT INTO public.audit_logs (branch_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_transfer.to_branch_id, auth.uid(), 'STOCK_TRANSFER_RECEIVED', 'stock_transfers', p_transfer_id,
    jsonb_build_object('destination_inventory_id', v_dest_inventory_id, 'batch_number', v_source.batch_number, 'quantity', v_transfer.quantity)
  );

  RETURN jsonb_build_object('transfer_id', p_transfer_id, 'status', 'received', 'destination_inventory_id', v_dest_inventory_id);
END;
$$;

-- Automated PEP Schedule Generator RPC
CREATE OR REPLACE FUNCTION public.rpc_generate_pep_schedule(
  p_case_id UUID,
  p_day0_date DATE,
  p_regimen public.regimen_type
)
RETURNS SETOF public.pep_schedules LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  SELECT branch_id INTO v_branch_id FROM public.bite_cases WHERE id = p_case_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bite case % not found.', p_case_id; END IF;

  IF NOT (public.is_admin() OR (public.is_clinical_staff() AND public.get_my_branch_id() = v_branch_id)) THEN
    RAISE EXCEPTION 'Forbidden: Cannot generate schedule outside assigned branch.';
  END IF;

  IF p_regimen = 'booster' THEN
    INSERT INTO public.pep_schedules (case_id, branch_id, dose_number, scheduled_date)
    VALUES
      (p_case_id, v_branch_id, 'Day 0', p_day0_date),
      (p_case_id, v_branch_id, 'Day 3', p_day0_date + INTERVAL '3 days')
    ON CONFLICT (case_id, dose_number) DO NOTHING;
  ELSIF p_regimen = 'ID' THEN
    INSERT INTO public.pep_schedules (case_id, branch_id, dose_number, scheduled_date)
    VALUES
      (p_case_id, v_branch_id, 'Day 0',  p_day0_date),
      (p_case_id, v_branch_id, 'Day 3',  p_day0_date + INTERVAL '3 days'),
      (p_case_id, v_branch_id, 'Day 7',  p_day0_date + INTERVAL '7 days'),
      (p_case_id, v_branch_id, 'Day 28', p_day0_date + INTERVAL '28 days')
    ON CONFLICT (case_id, dose_number) DO NOTHING;
  ELSE
    INSERT INTO public.pep_schedules (case_id, branch_id, dose_number, scheduled_date)
    VALUES
      (p_case_id, v_branch_id, 'Day 0',  p_day0_date),
      (p_case_id, v_branch_id, 'Day 3',  p_day0_date + INTERVAL '3 days'),
      (p_case_id, v_branch_id, 'Day 7',  p_day0_date + INTERVAL '7 days'),
      (p_case_id, v_branch_id, 'Day 14', p_day0_date + INTERVAL '14 days'),
      (p_case_id, v_branch_id, 'Day 28', p_day0_date + INTERVAL '28 days')
    ON CONFLICT (case_id, dose_number) DO NOTHING;
  END IF;

  RETURN QUERY SELECT * FROM public.pep_schedules WHERE case_id = p_case_id ORDER BY scheduled_date ASC;
END;
$$;
