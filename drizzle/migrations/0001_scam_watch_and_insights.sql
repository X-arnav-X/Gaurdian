-- Scam categories used by the AI and the Scam Watch map
CREATE TYPE public.scam_category AS ENUM (
  'fake_kyc', 'otp_phishing', 'courier_customs', 'electricity_bill',
  'digital_arrest', 'lottery_prize', 'impersonation', 'job_offer',
  'upi_request', 'other'
);

-- Neighbourhood reference data (public, non-personal)
CREATE TABLE public.areas (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL
);
GRANT SELECT ON public.areas TO anon, authenticated;
GRANT ALL ON public.areas TO service_role;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Areas are public reference data" ON public.areas FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.areas (slug, name, lat, lng) VALUES
  ('koramangala', 'Koramangala', 12.9352, 77.6245),
  ('indiranagar', 'Indiranagar', 12.9719, 77.6412),
  ('whitefield', 'Whitefield', 12.9698, 77.7500),
  ('jayanagar', 'Jayanagar', 12.9250, 77.5938),
  ('hsr-layout', 'HSR Layout', 12.9116, 77.6389),
  ('malleswaram', 'Malleswaram', 13.0055, 77.5692),
  ('basavanagudi', 'Basavanagudi', 12.9422, 77.5738),
  ('marathahalli', 'Marathahalli', 12.9591, 77.6974),
  ('rajajinagar', 'Rajajinagar', 12.9910, 77.5523),
  ('electronic-city', 'Electronic City', 12.8452, 77.6602),
  ('yelahanka', 'Yelahanka', 13.1007, 77.5963),
  ('btm-layout', 'BTM Layout', 12.9166, 77.6101),
  ('banashankari', 'Banashankari', 12.9255, 77.5468),
  ('hebbal', 'Hebbal', 13.0358, 77.5970),
  ('jp-nagar', 'JP Nagar', 12.9063, 77.5857),
  ('bellandur', 'Bellandur', 12.9304, 77.6784);

-- Optional neighbourhood on a senior profile, so their reports can join the map
ALTER TABLE public.profiles ADD COLUMN area TEXT REFERENCES public.areas(slug);

-- AI-assigned category on each check
ALTER TABLE public.scam_checks ADD COLUMN category public.scam_category NOT NULL DEFAULT 'other';

-- Fully anonymised report feed behind the map: no user id, ever.
CREATE TABLE public.scam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_slug TEXT NOT NULL REFERENCES public.areas(slug),
  category public.scam_category NOT NULL,
  source TEXT NOT NULL DEFAULT 'live',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX scam_reports_created_idx ON public.scam_reports (created_at DESC);
CREATE INDEX scam_reports_area_idx ON public.scam_reports (area_slug);
GRANT ALL ON public.scam_reports TO service_role;
ALTER TABLE public.scam_reports ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT grants for anon or authenticated: the map reads only through
-- the aggregate functions below, so raw rows are never exposed.

-- Real checks flow into the anonymised feed automatically.
CREATE OR REPLACE FUNCTION public.record_scam_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  senior_area TEXT;
BEGIN
  IF NEW.verdict <> 'scam' THEN
    RETURN NEW;
  END IF;
  SELECT area INTO senior_area FROM public.profiles WHERE id = NEW.senior_id;
  IF senior_area IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.scam_reports (area_slug, category, source, created_at)
  VALUES (senior_area, NEW.category, 'live', NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER scam_checks_to_reports
AFTER INSERT ON public.scam_checks
FOR EACH ROW EXECUTE FUNCTION public.record_scam_report();

-- Aggregate map data. Returns neighbourhood totals only.
CREATE OR REPLACE FUNCTION public.scam_watch(window_days INT DEFAULT 7)
RETURNS TABLE (
  area_slug TEXT,
  area_name TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  reports BIGINT,
  top_category public.scam_category,
  top_category_reports BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH recent AS (
    SELECT r.area_slug, r.category
    FROM public.scam_reports r
    WHERE r.created_at >= now() - make_interval(days => GREATEST(window_days, 1))
  ),
  per_type AS (
    SELECT recent.area_slug, recent.category, count(*) AS c
    FROM recent GROUP BY 1, 2
  ),
  totals AS (
    SELECT per_type.area_slug, sum(per_type.c) AS reports FROM per_type GROUP BY 1
  ),
  top AS (
    SELECT DISTINCT ON (per_type.area_slug) per_type.area_slug, per_type.category, per_type.c
    FROM per_type ORDER BY per_type.area_slug, per_type.c DESC, per_type.category
  )
  SELECT a.slug, a.name, a.lat, a.lng, t.reports, top.category, top.c
  FROM totals t
  JOIN public.areas a ON a.slug = t.area_slug
  JOIN top ON top.area_slug = t.area_slug
  ORDER BY t.reports DESC;
$$;
GRANT EXECUTE ON FUNCTION public.scam_watch(INT) TO anon, authenticated;

-- Category breakdown for the whole city in a window.
CREATE OR REPLACE FUNCTION public.scam_watch_categories(window_days INT DEFAULT 7)
RETURNS TABLE (category public.scam_category, reports BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.category, count(*)
  FROM public.scam_reports r
  WHERE r.created_at >= now() - make_interval(days => GREATEST(window_days, 1))
  GROUP BY 1
  ORDER BY 2 DESC;
$$;
GRANT EXECUTE ON FUNCTION public.scam_watch_categories(INT) TO anon, authenticated;

-- Headline numbers for the landing page and the insights screen. Counts only.
CREATE OR REPLACE FUNCTION public.platform_stats()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'seniors', (SELECT count(*) FROM public.profiles WHERE role = 'senior'),
    'families', (SELECT count(*) FROM public.profiles WHERE role = 'family'),
    'checks', (SELECT count(*) FROM public.scam_checks),
    'scams', (SELECT count(*) FROM public.scam_checks WHERE verdict = 'scam'),
    'voice_queries', (SELECT count(*) FROM public.voice_queries),
    'checkins', (SELECT count(*) FROM public.checkins),
    'reports_month', (SELECT count(*) FROM public.scam_reports WHERE created_at >= now() - interval '30 days'),
    'areas_covered', (SELECT count(DISTINCT area_slug) FROM public.scam_reports WHERE created_at >= now() - interval '30 days')
  );
$$;
GRANT EXECUTE ON FUNCTION public.platform_stats() TO anon, authenticated;

-- Simple daily series for the growth chart.
CREATE OR REPLACE FUNCTION public.daily_activity(window_days INT DEFAULT 30)
RETURNS TABLE (day DATE, reports BIGINT, checks BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH days AS (
    SELECT generate_series(
      (current_date - (GREATEST(window_days, 1) - 1))::date,
      current_date,
      interval '1 day'
    )::date AS day
  )
  SELECT d.day,
    (SELECT count(*) FROM public.scam_reports r WHERE r.created_at::date = d.day),
    (SELECT count(*) FROM public.scam_checks c WHERE c.created_at::date = d.day)
  FROM days d
  ORDER BY d.day;
$$;
GRANT EXECUTE ON FUNCTION public.daily_activity(INT) TO anon, authenticated;

-- "Request a demo" messages from the landing page.
CREATE TABLE public.demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.demo_requests TO anon, authenticated;
GRANT ALL ON public.demo_requests TO service_role;
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone may send a demo request" ON public.demo_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Seed: realistic looking reports across the last 30 days, weighted by area.
INSERT INTO public.scam_reports (area_slug, category, source, created_at)
SELECT
  w.slug,
  (ARRAY['fake_kyc','otp_phishing','courier_customs','electricity_bill','digital_arrest','lottery_prize','impersonation','job_offer','upi_request'])[
    1 + floor(random() * 9)::int
  ]::public.scam_category,
  'seed',
  now()
    - (random() * interval '29 days')
    - (random() * interval '20 hours')
FROM (
  VALUES
    ('koramangala', 34), ('indiranagar', 29), ('whitefield', 31), ('jayanagar', 26),
    ('hsr-layout', 24), ('malleswaram', 19), ('basavanagudi', 16), ('marathahalli', 21),
    ('rajajinagar', 14), ('electronic-city', 18), ('yelahanka', 11), ('btm-layout', 20),
    ('banashankari', 15), ('hebbal', 13), ('jp-nagar', 17), ('bellandur', 12)
) AS w(slug, n)
CROSS JOIN LATERAL generate_series(1, w.n) AS g(i);

-- A denser recent slice so "today" and "this week" both look alive.
INSERT INTO public.scam_reports (area_slug, category, source, created_at)
SELECT
  w.slug,
  (ARRAY['fake_kyc','fake_kyc','otp_phishing','otp_phishing','courier_customs','digital_arrest','upi_request','electricity_bill'])[
    1 + floor(random() * 8)::int
  ]::public.scam_category,
  'seed',
  now() - (random() * interval '22 hours')
FROM (
  VALUES
    ('koramangala', 6), ('indiranagar', 5), ('whitefield', 5), ('jayanagar', 4),
    ('hsr-layout', 4), ('malleswaram', 3), ('marathahalli', 3), ('btm-layout', 3),
    ('jp-nagar', 2), ('electronic-city', 2), ('basavanagudi', 2), ('hebbal', 2),
    ('banashankari', 2), ('rajajinagar', 1), ('yelahanka', 1), ('bellandur', 2)
) AS w(slug, n)
CROSS JOIN LATERAL generate_series(1, w.n) AS g(i);