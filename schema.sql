-- arconjobs-v2 initial database schema (PostgreSQL / Supabase Local)
-- Creates schemas and tables only. Includes a small seed for application statuses.
-- UUID PKs, partner/client org types, and role constraint for candidates.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS accounts;
CREATE SCHEMA IF NOT EXISTS directory;
CREATE SCHEMA IF NOT EXISTS candidates;
CREATE SCHEMA IF NOT EXISTS jobs;
CREATE SCHEMA IF NOT EXISTS applications;
CREATE SCHEMA IF NOT EXISTS documents;
CREATE SCHEMA IF NOT EXISTS finance;

-- ===================== accounts =====================
CREATE TABLE IF NOT EXISTS accounts.organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('partner','client')),
    name TEXT NOT NULL,
    country_code CHAR(2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_organization_name_type
  ON accounts.organization (lower(name), type);

CREATE TABLE IF NOT EXISTS accounts.profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    organization_id UUID REFERENCES accounts.organization(id) ON UPDATE CASCADE ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','staff','member','candidate')) DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT org_required_for_non_candidates CHECK (
        (role = 'candidate' AND organization_id IS NULL) OR
        (role <> 'candidate' AND organization_id IS NOT NULL)
    )
);

-- ===================== directory =====================
CREATE TABLE IF NOT EXISTS directory.country (
    code CHAR(2) PRIMARY KEY,
    name TEXT NOT NULL
);

-- ===================== candidates =====================
CREATE TABLE IF NOT EXISTS candidates.candidate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE REFERENCES accounts.profile(id) ON UPDATE CASCADE ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    passport_no TEXT,
    nationality_code CHAR(2) REFERENCES directory.country(code) ON UPDATE CASCADE ON DELETE SET NULL,
    birth_date DATE,
    gender TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_candidate_passport ON candidates.candidate (passport_no);
CREATE INDEX IF NOT EXISTS ix_candidate_email ON candidates.candidate (lower(email));

CREATE TABLE IF NOT EXISTS candidates.candidate_skill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates.candidate(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    level TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidates.candidate_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates.candidate(id) ON DELETE CASCADE,
    employer TEXT NOT NULL,
    role TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================== jobs =====================
CREATE TABLE IF NOT EXISTS jobs.job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES accounts.organization(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    salary_min INT,
    salary_max INT,
    currency CHAR(3),
    country_code CHAR(2) REFERENCES directory.country(code) ON UPDATE CASCADE ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_job_org ON jobs.job (organization_id);
CREATE INDEX IF NOT EXISTS ix_job_country_status ON jobs.job (country_code, status);

-- ===================== applications =====================
CREATE TABLE IF NOT EXISTS applications.status (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'pipeline'
);
CREATE TABLE IF NOT EXISTS applications.application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates.candidate(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs.job(id) ON DELETE CASCADE,
    current_status TEXT NOT NULL REFERENCES applications.status(code),
    source TEXT,
    owner_profile_id UUID REFERENCES accounts.profile(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(candidate_id, job_id)
);
CREATE INDEX IF NOT EXISTS ix_app_by_job ON applications.application (job_id);
CREATE INDEX IF NOT EXISTS ix_app_by_candidate ON applications.application (candidate_id);

CREATE TABLE IF NOT EXISTS applications.application_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications.application(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES accounts.profile(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_app_event_app ON applications.application_event (application_id);
CREATE INDEX IF NOT EXISTS ix_app_event_type ON applications.application_event (type);

CREATE TABLE IF NOT EXISTS applications.note (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications.application(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates.candidate(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_by UUID REFERENCES accounts.profile(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================== documents =====================
CREATE TABLE IF NOT EXISTS documents.document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type TEXT NOT NULL CHECK (owner_type IN ('candidate','application')),
    owner_id UUID NOT NULL,
    kind TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    uploaded_by UUID REFERENCES accounts.profile(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_document_owner ON documents.document (owner_type, owner_id);

-- ===================== finance =====================
CREATE TABLE IF NOT EXISTS finance.payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications.application(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    method TEXT,
    paid_at TIMESTAMPTZ,
    reference TEXT
);

-- Seed statuses
INSERT INTO applications.status (code, label, category) VALUES
  ('APPLIED','Applied','pipeline'),
  ('SCREENING','Screening','pipeline'),
  ('SELECTED','Selected','pipeline'),
  ('VISA','Visa Processing','pipeline'),
  ('DEPLOYED','Deployed','pipeline'),
  ('REJECTED','Rejected','terminal')
ON CONFLICT (code) DO NOTHING;

COMMIT;
