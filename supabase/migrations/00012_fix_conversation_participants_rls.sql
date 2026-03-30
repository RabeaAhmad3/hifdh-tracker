-- Fix infinite recursion in conversation_participants SELECT policy.
-- The old policy queried conversation_participants FROM conversation_participants,
-- causing Postgres to re-evaluate the same RLS policy in an infinite loop.
--
-- Fix: use a SECURITY DEFINER helper that bypasses RLS to check membership,
-- then reference it from the policy.

-- 1. Create a helper function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  );
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Participants can view members of their conversations"
  ON conversation_participants;

-- 3. Create the fixed policy using the helper
CREATE POLICY "Participants can view members of their conversations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (is_conversation_participant(conversation_id));

-- 4. Also fix messages SELECT policy (it subqueries conversation_participants
--    which triggers the same recursive RLS check)
DROP POLICY IF EXISTS "Participants can view messages in their conversations"
  ON messages;

CREATE POLICY "Participants can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (is_conversation_participant(conversation_id));

-- 5. Fix messages INSERT policy (same issue)
DROP POLICY IF EXISTS "Participants can send messages"
  ON messages;

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid())
    AND is_conversation_participant(conversation_id)
  );

-- 6. Fix messages UPDATE policy (same issue)
DROP POLICY IF EXISTS "Participants can mark messages as read"
  ON messages;

CREATE POLICY "Participants can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (is_conversation_participant(conversation_id));

-- 7. Fix conversations SELECT policy (also subqueries conversation_participants)
DROP POLICY IF EXISTS "Participants can view their conversations"
  ON conversations;

CREATE POLICY "Participants can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (is_conversation_participant(id));

-- 8. Fix conversations UPDATE policy
DROP POLICY IF EXISTS "Participants can update their conversations"
  ON conversations;

CREATE POLICY "Participants can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (is_conversation_participant(id));
