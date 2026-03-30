-- ============================================================
-- RPC: create_or_get_conversation
-- Returns an existing 1-on-1 conversation between the caller
-- and p_other_user_id, or creates one if none exists.
-- ============================================================

CREATE OR REPLACE FUNCTION create_or_get_conversation(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_conversation_id UUID;
BEGIN
  -- Validate both users exist
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_caller_id) THEN
    RAISE EXCEPTION 'Caller profile not found';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_other_user_id) THEN
    RAISE EXCEPTION 'Other user profile not found';
  END IF;

  IF v_caller_id = p_other_user_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  -- Look for an existing 1-on-1 conversation between these two users
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_caller_id
    AND cp2.user_id = p_other_user_id
    -- Ensure it's exactly a 2-person conversation
    AND (
      SELECT COUNT(*)
      FROM conversation_participants cp3
      WHERE cp3.conversation_id = cp1.conversation_id
    ) = 2
  LIMIT 1;

  -- If found, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create a new conversation
  INSERT INTO conversations DEFAULT VALUES
  RETURNING id INTO v_conversation_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES
    (v_conversation_id, v_caller_id),
    (v_conversation_id, p_other_user_id);

  RETURN v_conversation_id;
END;
$$;
