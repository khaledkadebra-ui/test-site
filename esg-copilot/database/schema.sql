-- ============================================================
-- ESG Copilot — PostgreSQL Schema
-- Version: 1.0.0
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'analyst', 'viewer');
CREATE TYPE report_status AS ENUM ('draft', 'processing', 'completed', 'failed');
CREATE TYPE submission_status AS ENUM ('incomplete', 'submitted', 'processing', 'processed');
CREATE TYPE scope_type AS ENUM ('scope1', 'scope2', 'scope3');
CREATE TYPE audit_action AS ENUM (
    'user.created', 'user.login', 'user.logout', 'user.updated',
    'company.created', 'company.updated',
    'submission.created', 'submission.submitted',
    'report.generated', 'report.downloaded', 'report.deleted',
    'document.uploaded', 'document.deleted',
    'data.updated'
);

-- ============================================================
-- COMPANIES (create before users so FK can reference it)
-- ============================================================

CREATE TABLE companies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    registration_number VARCHAR(100),
    industry_code       VARCHAR(50)  NOT NULL,    -- matches benchmarks.json keys
    nace_code           VARCHAR(10),              -- NACE Rev. 2 code (for CSRD readiness)
    country_code        CHAR(2)      NOT NULL,    -- ISO 3166-1 alpha-2
    city                VARCHAR(255),
    employee_count      INTEGER,
    revenue_eur         DECIMAL(20, 2),
    fiscal_year_end     VARCHAR(5),               -- e.g. '12-31'
    created_by          UUID,                     -- FK added after users table
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT         NOT NULL,        -- bcrypt
    full_name       VARCHAR(255),
    role            user_role    NOT NULL DEFAULT 'company_admin',
    company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Back-fill FK on companies
ALTER TABLE companies
    ADD CONSTRAINT fk_companies_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- DATA SUBMISSIONS
-- One per company per reporting year.
-- ============================================================

CREATE TABLE data_submissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_year  INTEGER NOT NULL,
    status          submission_status NOT NULL DEFAULT 'incomplete',
    submitted_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, reporting_year)
);

-- ============================================================
-- ENERGY & FUEL DATA  (Scope 1 stationary + mobile, Scope 2)
-- ============================================================

CREATE TABLE energy_data (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id               UUID NOT NULL REFERENCES data_submissions(id) ON DELETE CASCADE,

    -- Scope 1: Stationary combustion
    natural_gas_m3              DECIMAL(15, 2) NOT NULL DEFAULT 0,
    diesel_liters               DECIMAL(15, 2) NOT NULL DEFAULT 0,
    petrol_liters               DECIMAL(15, 2) NOT NULL DEFAULT 0,
    lpg_liters                  DECIMAL(15, 2) NOT NULL DEFAULT 0,
    heating_oil_liters          DECIMAL(15, 2) NOT NULL DEFAULT 0,
    coal_kg                     DECIMAL(15, 2) NOT NULL DEFAULT 0,
    biomass_wood_chips_kg       DECIMAL(15, 2) NOT NULL DEFAULT 0,

    -- Scope 1: Mobile combustion (company-owned vehicles)
    company_car_km              DECIMAL(15, 2) NOT NULL DEFAULT 0,
    company_van_km              DECIMAL(15, 2) NOT NULL DEFAULT 0,
    company_truck_km            DECIMAL(15, 2) NOT NULL DEFAULT 0,
    company_electric_car_km     DECIMAL(15, 2) NOT NULL DEFAULT 0,  -- Scope 1 = 0, tracked for Scope 2

    -- Scope 2: Purchased energy
    electricity_kwh             DECIMAL(15, 2) NOT NULL DEFAULT 0,
    district_heating_kwh        DECIMAL(15, 2) NOT NULL DEFAULT 0,
    renewable_electricity_pct   DECIMAL(5, 2)  NOT NULL DEFAULT 0,  -- 0–100

    -- Metadata
    data_quality_notes          TEXT,
    source_document_url         TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRAVEL DATA  (Scope 3: Cat 6 business travel, Cat 7 commuting)
-- ============================================================

CREATE TABLE travel_data (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id               UUID NOT NULL REFERENCES data_submissions(id) ON DELETE CASCADE,

    -- Category 6: Business travel
    air_short_haul_km           DECIMAL(15, 2) NOT NULL DEFAULT 0,  -- <3700 km, economy
    air_long_haul_km            DECIMAL(15, 2) NOT NULL DEFAULT 0,  -- >3700 km, economy
    air_business_class_pct      DECIMAL(5, 2)  NOT NULL DEFAULT 0,  -- % of long-haul in business
    rail_km                     DECIMAL(15, 2) NOT NULL DEFAULT 0,
    rental_car_km               DECIMAL(15, 2) NOT NULL DEFAULT 0,
    taxi_km                     DECIMAL(15, 2) NOT NULL DEFAULT 0,

    -- Category 7: Employee commuting
    avg_commute_km_one_way      DECIMAL(8, 2)  NOT NULL DEFAULT 0,
    commute_days_per_year       INTEGER        NOT NULL DEFAULT 220,
    commute_mode_car_pct        DECIMAL(5, 2)  NOT NULL DEFAULT 60,
    commute_mode_transit_pct    DECIMAL(5, 2)  NOT NULL DEFAULT 25,
    commute_mode_active_pct     DECIMAL(5, 2)  NOT NULL DEFAULT 15,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROCUREMENT DATA  (Scope 3: Cat 1 purchased goods)
-- ============================================================

CREATE TABLE procurement_data (
    id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id                   UUID NOT NULL REFERENCES data_submissions(id) ON DELETE CASCADE,

    purchased_goods_spend_eur       DECIMAL(20, 2) NOT NULL DEFAULT 0,
    supplier_count                  INTEGER,
    has_supplier_code_of_conduct    BOOLEAN NOT NULL DEFAULT FALSE,
    top_spend_category              VARCHAR(50),  -- maps to scope3_factors spend_based keys

    data_quality_notes              TEXT,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ESG POLICY DATA  (inputs for S + G scoring)
-- ============================================================

CREATE TABLE esg_policy_data (
    id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id                   UUID NOT NULL REFERENCES data_submissions(id) ON DELETE CASCADE,

    -- Environmental
    has_energy_reduction_target     BOOLEAN NOT NULL DEFAULT FALSE,
    has_net_zero_target             BOOLEAN NOT NULL DEFAULT FALSE,
    net_zero_target_year            INTEGER,
    waste_recycled_pct              DECIMAL(5, 2),
    has_waste_policy                BOOLEAN NOT NULL DEFAULT FALSE,
    has_water_policy                BOOLEAN NOT NULL DEFAULT FALSE,

    -- Social
    has_health_safety_policy        BOOLEAN NOT NULL DEFAULT FALSE,
    lost_time_injury_rate           DECIMAL(8, 4),   -- incidents per 200k hours worked
    has_training_program            BOOLEAN NOT NULL DEFAULT FALSE,
    avg_training_hours_per_employee DECIMAL(8, 2),
    has_diversity_policy            BOOLEAN NOT NULL DEFAULT FALSE,
    female_management_pct           DECIMAL(5, 2),   -- % women in management
    living_wage_commitment          BOOLEAN NOT NULL DEFAULT FALSE,

    -- Governance
    has_esg_policy                  BOOLEAN NOT NULL DEFAULT FALSE,
    has_code_of_conduct             BOOLEAN NOT NULL DEFAULT FALSE,
    has_anti_corruption_policy      BOOLEAN NOT NULL DEFAULT FALSE,
    has_data_privacy_policy         BOOLEAN NOT NULL DEFAULT FALSE,
    has_board_esg_oversight         BOOLEAN NOT NULL DEFAULT FALSE,
    esg_reporting_year              INTEGER,         -- year of last public ESG report
    supply_chain_code_of_conduct    BOOLEAN NOT NULL DEFAULT FALSE,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPLOADED DOCUMENTS
-- ============================================================

CREATE TABLE uploaded_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    submission_id       UUID REFERENCES data_submissions(id) ON DELETE SET NULL,
    original_filename   VARCHAR(500) NOT NULL,
    storage_path        TEXT NOT NULL,          -- encrypted path in S3/R2
    file_type           VARCHAR(20),            -- 'pdf', 'xlsx', 'csv'
    file_size_bytes     BIGINT,
    extraction_status   VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending|processing|done|failed
    extracted_data      JSONB,                  -- fields extracted by document processor
    extraction_error    TEXT,
    uploaded_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    submission_id   UUID NOT NULL REFERENCES data_submissions(id) ON DELETE RESTRICT,
    version         INTEGER NOT NULL DEFAULT 1,
    status          report_status NOT NULL DEFAULT 'draft',
    pdf_url         TEXT,                       -- S3/R2 URL of generated PDF
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at    TIMESTAMPTZ,
    error_message   TEXT,
    disclaimer      TEXT NOT NULL DEFAULT
        'This report is an AI-generated draft. CO2 calculations use published emission factors '
        '(IPCC AR6, DEFRA 2023, IEA 2023) but have not been independently verified. '
        'This report does not constitute CSRD compliance certification or assurance.',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REPORT RESULTS
-- All calculated values — NEVER written by the LLM.
-- ============================================================

CREATE TABLE report_results (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id                   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

    -- CO2 results (stored as kg for precision, displayed as tonnes in reports)
    scope1_co2e_kg              DECIMAL(20, 4),
    scope2_co2e_kg              DECIMAL(20, 4),
    scope3_co2e_kg              DECIMAL(20, 4),
    total_co2e_kg               DECIMAL(20, 4),

    -- Full breakdowns (JSONB — matches CalculationReport.scope*_breakdown)
    scope1_breakdown            JSONB,
    scope2_breakdown            JSONB,
    scope3_breakdown            JSONB,

    -- ESG scores (0–100)
    esg_score_total             DECIMAL(5, 2),
    esg_score_e                 DECIMAL(5, 2),
    esg_score_s                 DECIMAL(5, 2),
    esg_score_g                 DECIMAL(5, 2),
    esg_rating                  CHAR(1),         -- A, B, C, D, E
    industry_percentile         DECIMAL(5, 2),

    -- Score breakdowns (JSONB — matches CategoryScore.breakdown)
    e_breakdown                 JSONB,
    s_breakdown                 JSONB,
    g_breakdown                 JSONB,

    -- Gaps and roadmap (JSONB arrays from gap_analyzer.py)
    identified_gaps             JSONB,
    recommendations             JSONB,           -- structured Action objects

    -- AI-generated narrative (text ONLY — no numbers invented by LLM)
    executive_summary           TEXT,
    co2_narrative               TEXT,
    esg_narrative               TEXT,
    roadmap_narrative           TEXT,

    -- Engine metadata
    calculation_engine_version  VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    ai_model_used               VARCHAR(100),

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMISSION FACTORS REFERENCE TABLE
-- Mirrors JSON files but queryable for audit purposes.
-- Populated by seed_emission_factors.sql
-- ============================================================

CREATE TABLE emission_factors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope           scope_type  NOT NULL,
    category        VARCHAR(100) NOT NULL,
    subcategory     VARCHAR(100),
    name            VARCHAR(255) NOT NULL,
    factor_value    DECIMAL(15, 6) NOT NULL,
    per_unit        VARCHAR(50)  NOT NULL,       -- e.g. 'liter', 'kWh', 'km', 'EUR'
    result_unit     VARCHAR(50)  NOT NULL DEFAULT 'kg_co2e',
    country_code    CHAR(2),                     -- NULL = global
    year            INTEGER NOT NULL,
    source          VARCHAR(500) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS (append-only compliance log)
-- ============================================================

CREATE TABLE audit_logs (
    id          BIGSERIAL   PRIMARY KEY,         -- sequential for ordered log analysis
    user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
    company_id  UUID        REFERENCES companies(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs must never be updated or deleted
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_company         ON users(company_id);
CREATE INDEX idx_submissions_company   ON data_submissions(company_id);
CREATE INDEX idx_submissions_year      ON data_submissions(reporting_year);
CREATE INDEX idx_reports_company       ON reports(company_id);
CREATE INDEX idx_reports_status        ON reports(status);
CREATE INDEX idx_reports_submission    ON reports(submission_id);
CREATE INDEX idx_docs_company          ON uploaded_documents(company_id);
CREATE INDEX idx_docs_submission       ON uploaded_documents(submission_id);
CREATE INDEX idx_ef_scope_category     ON emission_factors(scope, category);
CREATE INDEX idx_audit_user            ON audit_logs(user_id);
CREATE INDEX idx_audit_company         ON audit_logs(company_id);
CREATE INDEX idx_audit_created         ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_entity          ON audit_logs(entity_type, entity_id);
