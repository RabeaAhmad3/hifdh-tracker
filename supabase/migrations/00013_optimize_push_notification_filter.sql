-- ============================================================
-- 00012: Optimize push notification preference filtering
-- Replaces N+1 loop with single set-based query
-- ============================================================

CREATE OR REPLACE FUNCTION send_push_notification(p_payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key  TEXT;
  v_type         TEXT;
  v_filtered_ids UUID[];
BEGIN
  SELECT value INTO v_supabase_url FROM app_config WHERE key = 'supabase_url';
  SELECT value INTO v_service_key  FROM app_config WHERE key = 'service_role_key';

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'Push notification skipped: app_config missing supabase_url or service_role_key';
    RETURN;
  END IF;

  v_type := p_payload ->> 'type';

  -- Filter recipients by notification preferences in a single query
  SELECT array_agg(r.id::UUID) INTO v_filtered_ids
  FROM jsonb_array_elements_text(p_payload -> 'recipient_ids') AS r(id)
  LEFT JOIN notification_preferences np ON np.user_id = r.id::UUID
  WHERE CASE v_type
    WHEN 'new_assignment' THEN COALESCE(np.new_assignment, TRUE)
    WHEN 'new_message'    THEN COALESCE(np.new_message, TRUE)
    WHEN 'meeting_booked' THEN COALESCE(np.meeting_booked, TRUE)
    WHEN 'absence'        THEN COALESCE(np.absence, TRUE)
    ELSE TRUE
  END;

  -- Skip HTTP call if no recipients remain
  IF v_filtered_ids IS NULL THEN
    RETURN;
  END IF;

  -- Replace recipient_ids in payload with filtered list
  p_payload := jsonb_set(p_payload, '{recipient_ids}', to_jsonb(v_filtered_ids));

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
