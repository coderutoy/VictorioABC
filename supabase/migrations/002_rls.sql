-- ============================================================================
-- Victorio ABC — Migration 002: Multi-Tenant Row Level Security (RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.get_my_branch_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT branch_id FROM public.profiles WHERE id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.get_my_patient_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.patients WHERE profile_id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE(public.get_my_role() = 'admin', FALSE); $$;

CREATE OR REPLACE FUNCTION public.is_clinical_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE(public.get_my_role() IN ('nurse', 'doctor'), FALSE); $$;

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bite_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pep_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;

-- BRANCHES
CREATE POLICY "branches_select_authenticated"
  ON public.branches FOR SELECT TO authenticated
  USING (status = 'active' OR public.is_admin());

CREATE POLICY "branches_admin_all"
  ON public.branches FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PROFILES
CREATE POLICY "profiles_select_self_branch_or_admin"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR (public.is_clinical_staff() AND branch_id = public.get_my_branch_id())
  );

CREATE POLICY "profiles_update_self_restricted"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = public.get_my_role()
    AND branch_id IS NOT DISTINCT FROM public.get_my_branch_id()
  );

CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PATIENTS
CREATE POLICY "patients_select_own_or_staff_or_admin"
  ON public.patients FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_clinical_staff() OR public.is_admin());

CREATE POLICY "patients_insert_self_or_nurse_or_admin"
  ON public.patients FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (public.get_my_role() = 'patient' AND profile_id = auth.uid())
    OR (public.get_my_role() = 'nurse' AND registered_branch_id = public.get_my_branch_id())
  );

CREATE POLICY "patients_update_self_or_nurse_or_admin"
  ON public.patients FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR public.get_my_role() = 'nurse' OR public.is_admin())
  WITH CHECK (profile_id = auth.uid() OR public.get_my_role() = 'nurse' OR public.is_admin());

-- BITE CASES
CREATE POLICY "bite_cases_select"
  ON public.bite_cases FOR SELECT TO authenticated
  USING (public.is_admin() OR patient_id = public.get_my_patient_id() OR public.is_clinical_staff());

CREATE POLICY "bite_cases_insert"
  ON public.bite_cases FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (public.get_my_role() = 'patient' AND patient_id = public.get_my_patient_id())
    OR (public.is_clinical_staff() AND branch_id = public.get_my_branch_id())
  );

CREATE POLICY "bite_cases_update_branch_staff"
  ON public.bite_cases FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.is_clinical_staff() AND branch_id = public.get_my_branch_id()))
  WITH CHECK (public.is_admin() OR (public.is_clinical_staff() AND branch_id = public.get_my_branch_id()));

-- CLINICAL ORDERS
CREATE POLICY "clinical_orders_select"
  ON public.clinical_orders FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_clinical_staff()
    OR EXISTS (
      SELECT 1 FROM public.bite_cases bc
      WHERE bc.id = clinical_orders.case_id AND bc.patient_id = public.get_my_patient_id()
    )
  );

CREATE POLICY "clinical_orders_insert_doctor"
  ON public.clinical_orders FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (public.get_my_role() = 'doctor' AND branch_id = public.get_my_branch_id() AND doctor_id = auth.uid())
  );

CREATE POLICY "clinical_orders_update_doctor"
  ON public.clinical_orders FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.get_my_role() = 'doctor' AND branch_id = public.get_my_branch_id()))
  WITH CHECK (public.is_admin() OR (public.get_my_role() = 'doctor' AND branch_id = public.get_my_branch_id()));

-- PEP SCHEDULES
CREATE POLICY "pep_schedules_select"
  ON public.pep_schedules FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_clinical_staff()
    OR EXISTS (
      SELECT 1 FROM public.bite_cases bc
      WHERE bc.id = pep_schedules.case_id AND bc.patient_id = public.get_my_patient_id()
    )
  );

CREATE POLICY "pep_schedules_insert_branch_staff"
  ON public.pep_schedules FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (public.is_clinical_staff() AND branch_id = public.get_my_branch_id()));

CREATE POLICY "pep_schedules_update_branch_staff"
  ON public.pep_schedules FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_clinical_staff())
  WITH CHECK (
    public.is_admin()
    OR (
      public.get_my_role() = 'nurse'
      AND (
        (status = 'completed' AND administered_branch_id = public.get_my_branch_id() AND nurse_id = auth.uid())
        OR (status <> 'completed' AND branch_id = public.get_my_branch_id())
      )
    )
    OR (
      public.get_my_role() = 'doctor'
      AND (branch_id = public.get_my_branch_id() OR administered_branch_id = public.get_my_branch_id())
    )
  );

-- VACCINE INVENTORY
CREATE POLICY "inventory_select_branch_or_admin"
  ON public.vaccine_inventory FOR SELECT TO authenticated
  USING (public.is_admin() OR (public.is_clinical_staff() AND branch_id = public.get_my_branch_id()));

CREATE POLICY "inventory_admin_write"
  ON public.vaccine_inventory FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- STOCK TRANSFERS
CREATE POLICY "stock_transfers_select_involved_branch_or_admin"
  ON public.stock_transfers FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      public.is_clinical_staff()
      AND (to_branch_id = public.get_my_branch_id() OR from_branch_id = public.get_my_branch_id())
    )
  );

CREATE POLICY "stock_transfers_insert_nurse_request"
  ON public.stock_transfers FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      public.get_my_role() = 'nurse'
      AND to_branch_id = public.get_my_branch_id()
      AND requested_by = auth.uid()
      AND status = 'pending'
    )
  );

CREATE POLICY "stock_transfers_admin_update"
  ON public.stock_transfers FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- NOTIFICATION LOGS
CREATE POLICY "notification_logs_select_branch_or_admin"
  ON public.notification_logs FOR SELECT TO authenticated
  USING (public.is_admin() OR (public.is_clinical_staff() AND branch_id = public.get_my_branch_id()));

-- AUDIT LOGS (Append-Only)
CREATE POLICY "audit_logs_select_admin_or_branch"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin() OR (public.is_clinical_staff() AND branch_id = public.get_my_branch_id()));

CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.is_admin());

-- EDUCATIONAL CONTENT
CREATE POLICY "educational_content_select_published"
  ON public.educational_content FOR SELECT TO authenticated
  USING (is_published = TRUE OR public.is_admin());

CREATE POLICY "educational_content_admin_all"
  ON public.educational_content FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- STORAGE BUCKET RLS
CREATE POLICY "wound_images_upload_patient_or_staff"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'wound-images'
    AND (public.is_admin() OR public.is_clinical_staff() OR (storage.foldername(name))[1] = auth.uid()::text)
  );

CREATE POLICY "wound_images_read_owner_staff_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'wound-images'
    AND (public.is_admin() OR public.is_clinical_staff() OR (storage.foldername(name))[1] = auth.uid()::text)
  );

CREATE POLICY "educational_media_admin_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'educational-media' AND public.is_admin());

CREATE POLICY "educational_media_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'educational-media');
