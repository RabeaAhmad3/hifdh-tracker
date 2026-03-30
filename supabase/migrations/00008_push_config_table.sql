-- ============================================================
-- 00008: Replace current_setting approach with app_config table
-- The postgres role on Supabase cannot ALTER DATABASE, so we
-- store secrets in a table protected by RLS (no policies = no
-- access except via SECURITY DEFINER functions).
-- ============================================================

-- 1. Config table
CREATE TABLE IF NOT EXISTS app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

INSERT INTO app_config (key, value) VALUES
  ('supabase_url', 'https://empgxbgtacofadsicazd.supabase.co'),
  ('service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcGd4Ymd0YWNvZmFkc2ljYXpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgzMDU1MywiZXhwIjoyMDkwNDA2NTUzfQ.eHyTzLr1rZxI-odFbeUX1RV60yUr2HkQ0qiU5sXW7gQ')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Update send_push_notification to read from app_config instead of current_setting
CREATE OR REPLACE FUNCTION send_push_notification(p_payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  SELECT value INTO v_supabase_url FROM app_config WHERE key = 'supabase_url';
  SELECT value INTO v_service_key  FROM app_config WHERE key = 'service_role_key';

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'Push notification skipped: app_config missing supabase_url or service_role_key';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := p_payload
  );
END;
$$;

-- 3. Add the missing UPDATE trigger for attendance (present → absent)
-- Uses IF NOT EXISTS pattern via DO block since CREATE TRIGGER lacks it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_attendance_updated_absent'
  ) THEN
    CREATE TRIGGER on_attendance_updated_absent
      AFTER UPDATE ON attendance
      FOR EACH ROW
      WHEN (NEW.status = 'absent' AND OLD.status != 'absent')
      EXECUTE FUNCTION notify_parent_absence();
  END IF;
END;
$$;
