-- ============================================================
-- ShieldX — Complete Database Schema v2
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name            VARCHAR(255) NOT NULL,
  email                VARCHAR(255) UNIQUE NOT NULL,
  phone                VARCHAR(20),
  password_hash        VARCHAR(255) NOT NULL,
  date_of_birth        DATE,
  gender               VARCHAR(20),
  address              TEXT,
  role                 VARCHAR(20) NOT NULL DEFAULT 'customer'
                       CHECK (role IN ('customer','underwriter','adjuster','admin')),
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  -- Password reset
  reset_token          VARCHAR(255),
  reset_token_expires  TIMESTAMPTZ,
  -- Email verification
  email_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  verify_token         VARCHAR(255),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- ── KYC DOCUMENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kyc_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type        VARCHAR(50) NOT NULL
                  CHECK (doc_type IN ('aadhaar','pan','driving_license','passport','address_proof')),
  file_path       VARCHAR(500) NOT NULL,
  file_name       VARCHAR(255) NOT NULL,
  file_size       INTEGER,
  mime_type       VARCHAR(100),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','verified','rejected')),
  verified_by     UUID REFERENCES users(id),
  verified_at     TIMESTAMPTZ,
  rejection_note  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One doc per type per user
  UNIQUE(user_id, doc_type)
);

CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status  ON kyc_documents(status);

-- ── INSURANCE PRODUCTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(255) NOT NULL,
  type             VARCHAR(20)  NOT NULL CHECK (type IN ('life','health','vehicle')),
  description      TEXT,
  base_premium     NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_age          INTEGER NOT NULL DEFAULT 18,
  max_age          INTEGER NOT NULL DEFAULT 70,
  max_coverage     NUMERIC(15,2),
  coverage_details JSONB,
  terms_months     INTEGER,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── POLICIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policies (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_number     VARCHAR(30) UNIQUE NOT NULL,
  user_id           UUID NOT NULL REFERENCES users(id),
  product_id        UUID NOT NULL REFERENCES products(id),
  type              VARCHAR(20) NOT NULL CHECK (type IN ('life','health','vehicle')),

  sum_assured       NUMERIC(15,2) NOT NULL,
  annual_premium    NUMERIC(12,2) NOT NULL,
  gst_amount        NUMERIC(10,2) NOT NULL,
  total_premium     NUMERIC(12,2) NOT NULL,

  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  next_renewal      DATE,

  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','active','rejected','expired','cancelled')),

  policy_details    JSONB,
  nominee_name      VARCHAR(255),
  nominee_relation  VARCHAR(100),

  -- NCB tracking
  ncb_percent       NUMERIC(5,2) NOT NULL DEFAULT 0,
  claim_free_years  INTEGER      NOT NULL DEFAULT 0,
  last_ncb_updated  DATE,

  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  certificate_path  VARCHAR(500),

  -- Renewal tracking
  parent_policy_id  UUID REFERENCES policies(id),  -- link renewed policies
  renewal_count     INTEGER NOT NULL DEFAULT 0,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_user_id      ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_status        ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_policies_next_renewal  ON policies(next_renewal)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_policies_end_date      ON policies(end_date)
  WHERE status = 'active';

-- ── PAYMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id         UUID NOT NULL REFERENCES policies(id),
  user_id           UUID NOT NULL REFERENCES users(id),
  amount            NUMERIC(12,2) NOT NULL,
  currency          VARCHAR(5)  NOT NULL DEFAULT 'INR',
  payment_method    VARCHAR(50),
  -- Razorpay fields
  razorpay_order_id   VARCHAR(255) UNIQUE,
  razorpay_payment_id VARCHAR(255) UNIQUE,
  razorpay_signature  VARCHAR(500),
  gateway_response  JSONB,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','success','failed','refunded')),
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_policy_id         ON payments(policy_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);

-- ── CLAIMS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claims (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_number    VARCHAR(25) UNIQUE NOT NULL,
  policy_id       UUID NOT NULL REFERENCES policies(id),
  user_id         UUID NOT NULL REFERENCES users(id),

  incident_date   DATE NOT NULL,
  description     TEXT NOT NULL,
  claim_amount    NUMERIC(12,2) NOT NULL,

  -- Validation against policy
  sum_assured_at_filing NUMERIC(15,2) NOT NULL, -- snapshot of sum_assured

  status          VARCHAR(20) NOT NULL DEFAULT 'submitted'
                  CHECK (status IN ('submitted','under_review','approved','rejected','disbursed')),

  assigned_to     UUID REFERENCES users(id),
  assigned_at     TIMESTAMPTZ,

  approved_amount NUMERIC(12,2),
  resolution_note TEXT,
  disbursed_at    TIMESTAMPTZ,
  bank_account    VARCHAR(30),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate claims for same incident
  UNIQUE(policy_id, incident_date, claim_amount)
);

CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_user_id   ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status    ON claims(status);

-- ── CLAIM DOCUMENTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS claim_documents (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id   UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  file_path  VARCHAR(500) NOT NULL,
  file_name  VARCHAR(255) NOT NULL,
  file_size  INTEGER,
  mime_type  VARCHAR(100),
  doc_type   VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_docs_claim_id ON claim_documents(claim_id);

-- ── CLAIM STATUS HISTORY (full audit trail) ───────────────
CREATE TABLE IF NOT EXISTS claim_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id    UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status   VARCHAR(20) NOT NULL,
  changed_by  UUID REFERENCES users(id),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_history_claim_id ON claim_status_history(claim_id);

-- ── RENEWAL REMINDERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS renewal_reminders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id     UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  reminder_date DATE NOT NULL,
  days_before   INTEGER NOT NULL,
  sent          BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at       TIMESTAMPTZ,
  channel       VARCHAR(20) DEFAULT 'email'
                CHECK (channel IN ('email','sms','both')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(policy_id, days_before)
);

CREATE INDEX IF NOT EXISTS idx_reminders_unsent ON renewal_reminders(reminder_date)
  WHERE sent = FALSE;

-- ── AUDIT LOG ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  details     JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id    ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity     ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);

-- ── NCB HISTORY ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ncb_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id     UUID NOT NULL REFERENCES policies(id),
  user_id       UUID NOT NULL REFERENCES users(id),
  old_ncb       NUMERIC(5,2) NOT NULL,
  new_ncb       NUMERIC(5,2) NOT NULL,
  reason        VARCHAR(100) NOT NULL,   -- 'claim_free_year' | 'claim_filed' | 'manual_reset'
  changed_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AUTO UPDATE updated_at TRIGGER ───────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at')
  THEN CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_policies_updated_at')
  THEN CREATE TRIGGER trg_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_claims_updated_at')
  THEN CREATE TRIGGER trg_claims_updated_at BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated_at')
  THEN CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END IF;
END $$;
