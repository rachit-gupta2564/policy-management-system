-- ============================================================
-- ShieldX Seed Data v2
-- ============================================================

-- Admin@123 hashed
INSERT INTO users (full_name, email, phone, password_hash, role, email_verified)
VALUES
  ('Raj Singh',    'admin@shieldx.in',       '9999000001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',       TRUE),
  ('Vikram Shah',  'underwriter@shieldx.in', '9999000002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'underwriter', TRUE),
  ('Priya Kapoor', 'adjuster@shieldx.in',    '9999000003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'adjuster',    TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, type, description, base_premium, min_age, max_age, max_coverage, coverage_details)
VALUES
(
  'ShieldX Term Plan', 'life',
  'Comprehensive term life insurance protecting your family''s financial future.',
  850.00, 18, 65, 50000000.00,
  '{"features":["Term & Whole Life options","Sum assured up to ₹5 Cr","Critical illness rider","Tax benefits under 80C"],"riders":["critical_illness","accidental_death","waiver_of_premium"]}'
),
(
  'ShieldX Health Plus', 'health',
  'Cashless hospitalization at 10,000+ network hospitals with family floater plans.',
  650.00, 0, 70, 10000000.00,
  '{"features":["Cashless hospitalization","Pre & post hospitalization","Day care procedures","Mental health coverage"],"network_hospitals":10000}'
),
(
  'ShieldX Motor Comprehensive', 'vehicle',
  'Comprehensive and third-party liability coverage for all vehicle types.',
  0.00, 18, 99, NULL,
  '{"features":["Own damage & 3rd party","Zero depreciation add-on","24/7 roadside assistance","No-claim bonus up to 50%"],"addons":["zero_depreciation","roadside_assist","engine_protect","return_to_invoice"]}'
),
(
  'ShieldX Senior Care', 'health',
  'Dedicated health coverage for senior citizens.',
  2100.00, 60, 80, 2500000.00,
  '{"features":["Pre-existing conditions covered","Domiciliary hospitalization","Annual health checkup","Home nursing"],"waiting_period_months":12}'
)
ON CONFLICT DO NOTHING;
