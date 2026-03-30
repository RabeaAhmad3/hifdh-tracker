-- ============================================================
-- Section 9: Report RPC functions & indexes
-- ============================================================

-- ---- Indexes for report queries ----

CREATE INDEX IF NOT EXISTS idx_assignments_student_date
  ON assignments (student_id, date);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date
  ON attendance (student_id, date);

CREATE INDEX IF NOT EXISTS idx_behavior_logs_student_date
  ON behavior_logs (student_id, date);


-- ---- Helper: check caller can access a student ----

CREATE OR REPLACE FUNCTION _check_student_access(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();

  IF v_role IN ('teacher', 'admin') THEN
    RETURN; -- teachers/admins can access any student
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM parent_students
    WHERE parent_id = auth.uid() AND student_id = p_student_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$;


-- ============================================================
-- 1. get_student_report
--    Groups assignments by category, counts total/passed, pass rate, pages
-- ============================================================

CREATE OR REPLACE FUNCTION get_student_report(
  p_student_id UUID,
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM _check_student_access(p_student_id);

  RETURN (
    SELECT coalesce(
      jsonb_object_agg(category, row_data),
      '{}'::jsonb
    )
    FROM (
      SELECT
        category,
        jsonb_build_object(
          'total',     count(*)::int,
          'passed',    count(*) FILTER (WHERE status = 'pass')::int,
          'pass_rate', CASE
                         WHEN count(*) = 0 THEN 0
                         ELSE round((count(*) FILTER (WHERE status = 'pass')::numeric / count(*)) * 100)
                       END::int,
          'pages',     coalesce(sum(pages_completed), 0)::int
        ) AS row_data
      FROM assignments
      WHERE student_id = p_student_id
        AND date >= p_start_date
        AND date <= p_end_date
      GROUP BY category
    ) sub
  );
END;
$$;


-- ============================================================
-- 2. get_student_trends
--    Returns one row per assignment for line/bar charts
-- ============================================================

CREATE OR REPLACE FUNCTION get_student_trends(
  p_student_id UUID,
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS TABLE (
  date            DATE,
  category        TEXT,
  passed          BOOLEAN,
  mistakes        INT,
  pauses          INT,
  pages_completed INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM _check_student_access(p_student_id);

  RETURN QUERY
  SELECT
    a.date,
    a.category::text,
    (a.status = 'pass')    AS passed,
    a.mistakes::int,
    a.pauses::int,
    a.pages_completed::int
  FROM assignments a
  WHERE a.student_id = p_student_id
    AND a.date >= p_start_date
    AND a.date <= p_end_date
  ORDER BY a.date ASC;
END;
$$;


-- ============================================================
-- 3. get_attendance_summary
--    Counts each attendance status for a date range
-- ============================================================

CREATE OR REPLACE FUNCTION get_attendance_summary(
  p_student_id UUID,
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM _check_student_access(p_student_id);

  RETURN (
    SELECT jsonb_build_object(
      'present',    count(*) FILTER (WHERE status = 'present')::int,
      'absent',     count(*) FILTER (WHERE status = 'absent')::int,
      'late',       count(*) FILTER (WHERE status = 'late')::int,
      'left_early', count(*) FILTER (WHERE status = 'left_early')::int,
      'total',      count(*)::int
    )
    FROM attendance
    WHERE student_id = p_student_id
      AND date >= p_start_date
      AND date <= p_end_date
  );
END;
$$;


-- ============================================================
-- 4. get_behavior_summary
--    Counts each behavior rating for a date range
-- ============================================================

CREATE OR REPLACE FUNCTION get_behavior_summary(
  p_student_id UUID,
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM _check_student_access(p_student_id);

  RETURN (
    SELECT jsonb_build_object(
      'very_good',          count(*) FILTER (WHERE rating = 'very_good')::int,
      'good',               count(*) FILTER (WHERE rating = 'good')::int,
      'needs_improvement',  count(*) FILTER (WHERE rating = 'needs_improvement')::int,
      'total',              count(*)::int
    )
    FROM behavior_logs
    WHERE student_id = p_student_id
      AND date >= p_start_date
      AND date <= p_end_date
  );
END;
$$;


-- ============================================================
-- 5. get_class_overview
--    Teacher dashboard: attendance, missing assignments, pass rates, excuses
--    Restricted to teacher/admin roles only
-- ============================================================

CREATE OR REPLACE FUNCTION get_class_overview(p_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Access denied: teacher or admin role required';
  END IF;

  RETURN (
    WITH
      att AS (
        SELECT
          count(*) FILTER (WHERE status = 'present')::int AS present,
          count(*)::int AS total
        FROM attendance
        WHERE date = p_date
      ),
      missing AS (
        SELECT jsonb_agg(jsonb_build_object('id', s.id, 'full_name', s.full_name))
          AS students
        FROM students s
        WHERE NOT EXISTS (
          SELECT 1 FROM assignments a
          WHERE a.student_id = s.id AND a.date = p_date
        )
      ),
      week_bounds AS (
        SELECT
          (p_date - EXTRACT(dow FROM p_date)::int)::date AS w_start,
          (p_date - EXTRACT(dow FROM p_date)::int + 6)::date AS w_end
      ),
      weekly AS (
        SELECT
          category,
          CASE
            WHEN count(*) = 0 THEN 0
            ELSE round((count(*) FILTER (WHERE status = 'pass')::numeric / count(*)) * 100)
          END::int AS pass_rate
        FROM assignments, week_bounds wb
        WHERE date >= wb.w_start AND date <= wb.w_end
        GROUP BY category
      ),
      weekly_obj AS (
        SELECT jsonb_build_object(
          'new_lesson',      coalesce((SELECT pass_rate FROM weekly WHERE category = 'new_lesson'), 0),
          'previous_lesson', coalesce((SELECT pass_rate FROM weekly WHERE category = 'previous_lesson'), 0),
          'revision',        coalesce((SELECT pass_rate FROM weekly WHERE category = 'revision'), 0)
        ) AS rates
      ),
      excuses AS (
        SELECT count(*)::int AS cnt
        FROM absence_excuses ae
        WHERE ae.date = p_date
      )
    SELECT jsonb_build_object(
      'today_attendance', jsonb_build_object('present', att.present, 'total', att.total),
      'students_without_assignments_today', coalesce(missing.students, '[]'::jsonb),
      'weekly_pass_rates', weekly_obj.rates,
      'pending_excuses', excuses.cnt
    )
    FROM att, missing, weekly_obj, excuses
  );
END;
$$;
