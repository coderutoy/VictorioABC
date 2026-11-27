-- ============================================================================
-- Victorio ABC — Development Seed Data (7 Official Branches, HQ Stock, Patient Education)
-- ============================================================================

INSERT INTO public.branches (id, name, address, barangay, municipality, contact_number, operating_hours, status)
VALUES
  (
    '11111111-1111-1111-1111-111111111101',
    'Victorio ABC — Baliwag, Bulacan',
    'Benigno S. Aquino Avenue, Baliwag, Bulacan',
    'Benigno S. Aquino Ave',
    'Baliwag, Bulacan',
    '09933269641',
    '{"daily": "08:00-17:00"}'::jsonb,
    'active'
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'Victorio ABC — Santa Maria, Bulacan',
    'Santa Maria Bypass Rd, Santa Maria, Bulacan',
    'Santa Maria Bypass Rd',
    'Santa Maria, Bulacan',
    '09454378284',
    '{"daily": "08:00-17:00"}'::jsonb,
    'active'
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'Victorio ABC — Mapulang Lupa, Pandi',
    '98 Pandi Angat Rd, Pandi, Bulacan',
    'Mapulang Lupa',
    'Pandi, Bulacan',
    '09101909050',
    '{"daily": "08:00-17:00"}'::jsonb,
    'active'
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    'Victorio ABC — DRT, Bulacan',
    '201 M. Valte Road, Pulong Sampalok, Dona Remedios Trinidad, Bulacan',
    'Pulong Sampalok',
    'Doña Remedios Trinidad, Bulacan',
    '09751861541',
    '{"daily": "08:00-17:00"}'::jsonb,
    'active'
  ),
  (
    '11111111-1111-1111-1111-111111111105',
    'Victorio ABC — Meycauayan, Bulacan (Camalig)',
    'Blk 64 Lot 9 El Camino Real Camalig, Meycauayan, Bulacan',
    'Camalig',
    'Meycauayan, Bulacan',
    '09517734066',
    '{"daily": "08:00-17:00"}'::jsonb,
    'active'
  ),
  (
    '11111111-1111-1111-1111-111111111106',
    'Victorio ABC — Poblacion / Calvario, Meycauayan',
    '009 Pacheco Street, Calvario, Meycauayan, 3020 Bulacan',
    'Calvario / Poblacion',
    'Meycauayan, Bulacan',
    '09101909050',
    '{"daily": "08:00-17:00"}'::jsonb,
    'active'
  ),
  (
    '11111111-1111-1111-1111-111111111107',
    'Victorio ABC — Cefels, Caloocan',
    'Flojems Building Second Floor, Cefeles, Caloocan, 1427 Metro Manila',
    'Cefels',
    'Caloocan, Metro Manila',
    '09453311310',
    '{"daily": "08:00-17:00"}'::jsonb,
    'active'
  )
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vaccine_inventory (branch_id, item_type, vaccine_name, batch_number, lot_number, quantity_remaining, low_stock_threshold, expiration_date)
VALUES
  (NULL, 'anti_rabies', 'Speeda (PVRV)', 'SPD-2026-01', 'LOT-A001', 500, 50, '2027-12-31'),
  (NULL, 'erig', 'Equirab (ERIG)', 'EQR-2026-04', 'LOT-E004', 150, 20, '2027-09-30'),
  (NULL, 'tetanus', 'Tetanus Toxoid (TT)', 'TTX-2026-02', 'LOT-T002', 400, 40, '2028-03-31'),
  ('11111111-1111-1111-1111-111111111101', 'anti_rabies', 'Speeda (PVRV)', 'SPD-2026-01', 'LOT-A001', 60, 15, '2027-12-31'),
  ('11111111-1111-1111-1111-111111111102', 'anti_rabies', 'Speeda (PVRV)', 'SPD-2026-01', 'LOT-A001', 40, 15, '2027-12-31')
ON CONFLICT ON CONSTRAINT uq_inventory_branch_batch DO NOTHING;

INSERT INTO public.educational_content (title, slug, category, body_content, is_published)
VALUES
  (
    'Immediate First Aid After an Animal Bite',
    'rabies-first-aid',
    'first_aid',
    'Wash the wound thoroughly with running water and soap for at least 15 minutes immediately after exposure. Apply povidone-iodine or 70% alcohol if available, do not cover tightly, and visit the nearest Victorio ABC branch for medical assessment.',
    TRUE
  ),
  (
    'Why Tandok and Garlic Do Not Prevent Rabies',
    'myth-busting-tandok',
    'myth_busting',
    'Traditional practices such as tandok (suction using animal horn), rubbing garlic, vinegar, or chili on bite wounds do not neutralize the rabies virus and increase the risk of severe bacterial infection and fatal treatment delays. Only WHO-approved Post-Exposure Prophylaxis (PEP) prevents rabies.',
    TRUE
  ),
  (
    '14-Day Biting Animal Observation Guide',
    '14-day-animal-observation',
    'animal_observation',
    'If the biting dog or cat is a known domestic pet, keep it confined and observe it for 14 days without killing it. Report immediately to your Victorio ABC clinic if the animal shows behavioral changes, excessive salivation, paralysis, or dies during observation.',
    TRUE
  )
ON CONFLICT (slug) DO NOTHING;
