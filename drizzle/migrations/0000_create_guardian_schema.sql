-- Roles / language enums
CREATE TYPE public.app_role AS ENUM ('senior', 'family');
CREATE TYPE public.pref_language AS ENUM ('en', 'hi', 'kn');
CREATE TYPE public.scam_verdict AS ENUM ('scam', 'safe', 'unsure');
CREATE TYPE public.check_input_type AS ENUM ('text', 'screenshot');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  preferred_language public.pref_language NOT NULL DEFAULT 'en',
  safety_code TEXT UNIQUE,
  linked_senior_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper: the senior a given user is allowed to observe (self for seniors, linked for family)
CREATE OR REPLACE FUNCTION public.observed_senior_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN p.role = 'senior' THEN p.id ELSE p.linked_senior_id END
  FROM public.profiles p
  WHERE p.id = _user_id
$$;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Family can read their linked senior profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = public.observed_senior_id(auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Look up a senior by safety code (used at family signup; code is the shared secret)
CREATE OR REPLACE FUNCTION public.senior_by_safety_code(_code TEXT)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name
  FROM public.profiles p
  WHERE p.role = 'senior' AND upper(p.safety_code) = upper(trim(_code))
$$;

GRANT EXECUTE ON FUNCTION public.senior_by_safety_code(TEXT) TO anon, authenticated;

-- Username -> login email lookup (usernames are not secret-bearing on their own)
CREATE OR REPLACE FUNCTION public.username_exists(_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(trim(_username)))
$$;

GRANT EXECUTE ON FUNCTION public.username_exists(TEXT) TO anon, authenticated;

-- Scam checks
CREATE TABLE public.scam_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  input_type public.check_input_type NOT NULL DEFAULT 'text',
  verdict public.scam_verdict NOT NULL,
  confidence TEXT,
  summary TEXT NOT NULL,
  red_flags TEXT[] NOT NULL DEFAULT '{}',
  recommended_action TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.scam_checks TO authenticated;
GRANT ALL ON public.scam_checks TO service_role;
ALTER TABLE public.scam_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read checks for observed senior"
  ON public.scam_checks FOR SELECT TO authenticated
  USING (senior_id = public.observed_senior_id(auth.uid()));

CREATE POLICY "Seniors insert own checks"
  ON public.scam_checks FOR INSERT TO authenticated
  WITH CHECK (senior_id = auth.uid());

-- Voice queries (private to the senior)
CREATE TABLE public.voice_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.voice_queries TO authenticated;
GRANT ALL ON public.voice_queries TO service_role;
ALTER TABLE public.voice_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seniors read own voice queries"
  ON public.voice_queries FOR SELECT TO authenticated
  USING (senior_id = auth.uid());

CREATE POLICY "Seniors insert own voice queries"
  ON public.voice_queries FOR INSERT TO authenticated
  WITH CHECK (senior_id = auth.uid());

-- Check-ins
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read checkins for observed senior"
  ON public.checkins FOR SELECT TO authenticated
  USING (senior_id = public.observed_senior_id(auth.uid()));

CREATE POLICY "Seniors insert own checkins"
  ON public.checkins FOR INSERT TO authenticated
  WITH CHECK (senior_id = auth.uid());

CREATE INDEX idx_scam_checks_senior_created ON public.scam_checks (senior_id, created_at DESC);
CREATE INDEX idx_checkins_senior_created ON public.checkins (senior_id, created_at DESC);
CREATE INDEX idx_voice_queries_senior_created ON public.voice_queries (senior_id, created_at DESC);