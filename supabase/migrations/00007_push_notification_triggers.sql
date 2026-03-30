-- ============================================================
-- 00007: Push Notification Triggers
-- Adds platform column, pg_net extension, trigger functions
-- that call the send-push-notification edge function
-- ============================================================

-- 1. Enable pg_net for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- 2. Add platform column to push_tokens
ALTER TABLE push_tokens ADD COLUMN platform TEXT NOT NULL DEFAULT 'unknown';

-- 3. Config table for secrets (avoids ALTER DATABASE which requires superuser)
CREATE TABLE IF NOT EXISTS app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
-- No RLS policies — only SECURITY DEFINER functions can read this table

INSERT INTO app_config (key, value) VALUES
  ('supabase_url', 'https://empgxbgtacofadsicazd.supabase.co'),
  ('service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcGd4Ymd0YWNvZmFkc2ljYXpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgzMDU1MywiZXhwIjoyMDkwNDA2NTUzfQ.eHyTzLr1rZxI-odFbeUX1RV60yUr2HkQ0qiU5sXW7gQ')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- 4. Shared helper for sending push notifications
-- ============================================================

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

-- ============================================================
-- 4. Trigger Functions
-- ============================================================

-- 4a. Notify parent(s) when a new assignment is created
CREATE OR REPLACE FUNCTION notify_parent_new_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_name TEXT;
  v_recipient_ids UUID[];
BEGIN
  SELECT full_name INTO v_student_name
    FROM students WHERE id = NEW.student_id;

  SELECT array_agg(parent_id) INTO v_recipient_ids
    FROM parent_students WHERE student_id = NEW.student_id;

  IF v_recipient_ids IS NULL OR array_length(v_recipient_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM send_push_notification(jsonb_build_object(
    'type', 'new_assignment',
    'recipient_ids', to_jsonb(v_recipient_ids),
    'student_name', v_student_name,
    'category', NEW.category,
    'date', NEW.date::TEXT
  ));

  RETURN NEW;
END;
$$;

-- 4b. Notify other participants when a new message is sent
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_name TEXT;
  v_recipient_ids UUID[];
BEGIN
  SELECT full_name INTO v_sender_name
    FROM profiles WHERE id = NEW.sender_id;

  SELECT array_agg(user_id) INTO v_recipient_ids
    FROM conversation_participants
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id;

  IF v_recipient_ids IS NULL OR array_length(v_recipient_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM send_push_notification(jsonb_build_object(
    'type', 'new_message',
    'recipient_ids', to_jsonb(v_recipient_ids),
    'sender_name', v_sender_name,
    'content_preview', left(NEW.content, 100),
    'conversation_id', NEW.conversation_id
  ));

  RETURN NEW;
END;
$$;

-- 4c. Notify teacher when a meeting is booked
CREATE OR REPLACE FUNCTION notify_teacher_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_name TEXT;
  v_student_name TEXT;
BEGIN
  SELECT full_name INTO v_parent_name
    FROM profiles WHERE id = NEW.parent_id;

  SELECT full_name INTO v_student_name
    FROM students WHERE id = NEW.student_id;

  PERFORM send_push_notification(jsonb_build_object(
    'type', 'meeting_booked',
    'recipient_ids', to_jsonb(ARRAY[NEW.teacher_id]),
    'parent_name', v_parent_name,
    'student_name', v_student_name,
    'date', NEW.date::TEXT,
    'start_time', NEW.start_time::TEXT
  ));

  RETURN NEW;
END;
$$;

-- 4d. Notify parent(s) when a student is marked absent
CREATE OR REPLACE FUNCTION notify_parent_absence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_name TEXT;
  v_recipient_ids UUID[];
BEGIN
  SELECT full_name INTO v_student_name
    FROM students WHERE id = NEW.student_id;

  SELECT array_agg(parent_id) INTO v_recipient_ids
    FROM parent_students WHERE student_id = NEW.student_id;

  IF v_recipient_ids IS NULL OR array_length(v_recipient_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM send_push_notification(jsonb_build_object(
    'type', 'absence',
    'recipient_ids', to_jsonb(v_recipient_ids),
    'student_name', v_student_name,
    'date', NEW.date::TEXT
  ));

  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. Triggers
-- ============================================================

CREATE TRIGGER on_assignment_inserted
  AFTER INSERT ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_parent_new_assignment();

CREATE TRIGGER on_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

CREATE TRIGGER on_meeting_booked
  AFTER INSERT ON meeting_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_teacher_new_booking();

CREATE TRIGGER on_attendance_absent
  AFTER INSERT ON attendance
  FOR EACH ROW
  WHEN (NEW.status = 'absent')
  EXECUTE FUNCTION notify_parent_absence();

CREATE TRIGGER on_attendance_updated_absent
  AFTER UPDATE ON attendance
  FOR EACH ROW
  WHEN (NEW.status = 'absent' AND OLD.status != 'absent')
  EXECUTE FUNCTION notify_parent_absence();
