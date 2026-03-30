-- ============================================================
-- Hifdh Tracker — Initial Schema Migration
-- Run in Supabase SQL Editor (single transaction)
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ============================================================
-- 2. ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');
CREATE TYPE assignment_category AS ENUM ('new_lesson', 'previous_lesson', 'revision');
CREATE TYPE pass_status AS ENUM ('pass', 'not_pass');
CREATE TYPE behavior_rating AS ENUM ('very_good', 'good', 'needs_improvement');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'left_early');
CREATE TYPE invite_status AS ENUM ('pending', 'used', 'expired');
CREATE TYPE meeting_status AS ENUM ('confirmed', 'cancelled');

-- ============================================================
-- 3. TABLES (FK dependency order)
-- ============================================================

-- 4.1 profiles
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'parent',
  full_name   TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.2 students
CREATE TABLE students (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT NOT NULL,
  date_of_birth DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.3 parent_students
CREATE TABLE parent_students (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

-- 4.4 invite_codes
CREATE TABLE invite_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      invite_status NOT NULL DEFAULT 'pending',
  used_by     UUID REFERENCES profiles(id),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.5 assignments
CREATE TABLE assignments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  category            assignment_category NOT NULL,
  surah_number        INT,
  surah_name          TEXT,
  start_ayah          INT,
  end_ayah            INT,
  status              pass_status,
  notes               TEXT,
  parent_reviewed     BOOLEAN NOT NULL DEFAULT false,
  parent_reviewed_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, date, category)
);

-- 4.6 behavior_logs
CREATE TABLE behavior_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  rating      behavior_rating NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);

-- 4.7 attendance
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  status      attendance_status NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);

-- 4.8 absence_excuses
CREATE TABLE absence_excuses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.9 conversations
CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.10 conversation_participants
CREATE TABLE conversation_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

-- 4.11 messages
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.12 teacher_availability
CREATE TABLE teacher_availability (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  CHECK (start_time < end_time),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.13 meeting_bookings
CREATE TABLE meeting_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  CHECK (start_time < end_time),
  status          meeting_status NOT NULL DEFAULT 'confirmed',
  notes           TEXT,
  google_event_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.14 push_tokens
CREATE TABLE push_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

-- ============================================================
-- 4. HELPER FUNCTION — get_user_role()
-- (after tables so SQL function body can reference profiles)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- 5. INDEXES
-- ============================================================

-- Note: assignments(student_id, date, category), behavior_logs(student_id, date),
-- and attendance(student_id, date) already have UNIQUE constraint indexes.

-- Message ordering within conversations
CREATE INDEX idx_messages_conversation_created ON messages (conversation_id, created_at);

-- Fast unread message counts per conversation
CREATE INDEX idx_messages_unread ON messages (conversation_id) WHERE is_read = false;

-- Fast pending invite code lookup
CREATE INDEX idx_invite_codes_pending ON invite_codes (code) WHERE status = 'pending';

-- Critical for RLS subquery performance on parent_students
CREATE INDEX idx_parent_students_parent ON parent_students (parent_id);
CREATE INDEX idx_parent_students_student ON parent_students (student_id);

-- FK indexes (Postgres does NOT auto-index FK columns)
CREATE INDEX idx_assignments_teacher ON assignments (teacher_id);
CREATE INDEX idx_behavior_logs_teacher ON behavior_logs (teacher_id);
CREATE INDEX idx_attendance_teacher ON attendance (teacher_id);
CREATE INDEX idx_absence_excuses_student ON absence_excuses (student_id);
CREATE INDEX idx_absence_excuses_parent ON absence_excuses (parent_id);
CREATE INDEX idx_conversation_participants_user ON conversation_participants (user_id);
CREATE INDEX idx_conversation_participants_conv ON conversation_participants (conversation_id);
CREATE INDEX idx_messages_sender ON messages (sender_id);
CREATE INDEX idx_teacher_availability_teacher ON teacher_availability (teacher_id);
CREATE INDEX idx_meeting_bookings_teacher ON meeting_bookings (teacher_id);
CREATE INDEX idx_meeting_bookings_parent ON meeting_bookings (parent_id);
CREATE INDEX idx_meeting_bookings_student ON meeting_bookings (student_id);
CREATE INDEX idx_push_tokens_user ON push_tokens (user_id);
CREATE INDEX idx_invite_codes_student ON invite_codes (student_id);
CREATE INDEX idx_invite_codes_created_by ON invite_codes (created_by);

-- ============================================================
-- 6. updated_at TRIGGERS (moddatetime)
-- ============================================================

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_updated_at_students
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_updated_at_invite_codes
  BEFORE UPDATE ON invite_codes
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_updated_at_assignments
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_updated_at_behavior_logs
  BEFORE UPDATE ON behavior_logs
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_updated_at_attendance
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_updated_at_teacher_availability
  BEFORE UPDATE ON teacher_availability
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_updated_at_meeting_bookings
  BEFORE UPDATE ON meeting_bookings
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_updated_at_push_tokens
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ============================================================
-- 7. FUNCTIONS
-- ============================================================

-- 7.1 handle_new_user() — Auth trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role user_role;
  _name TEXT;
BEGIN
  -- Safe role extraction with CASE validation (no raw cast)
  _role := CASE
    WHEN NEW.raw_user_meta_data ->> 'role' IN ('admin', 'teacher', 'parent')
    THEN (NEW.raw_user_meta_data ->> 'role')::user_role
    ELSE 'parent'::user_role
  END;

  _name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', '');

  INSERT INTO profiles (id, role, full_name)
  VALUES (NEW.id, _role, _name);

  RETURN NEW;
END;
$$;

-- 7.2 generate_invite_code(p_student_id)
CREATE OR REPLACE FUNCTION generate_invite_code(p_student_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code TEXT;
BEGIN
  -- Verify caller is teacher or admin
  IF get_user_role() IS NULL OR get_user_role() NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Only teachers and admins can generate invite codes';
  END IF;

  -- Verify student exists
  IF NOT EXISTS (SELECT 1 FROM students WHERE id = p_student_id) THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  -- Generate 8-char uppercase alphanumeric code, retry on collision
  LOOP
    _code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    BEGIN
      INSERT INTO invite_codes (code, student_id, created_by)
      VALUES (_code, p_student_id, auth.uid());
      RETURN _code;
    EXCEPTION WHEN unique_violation THEN
      -- Extremely unlikely collision — retry
      CONTINUE;
    END;
  END LOOP;
END;
$$;

-- 7.3 redeem_invite_code(p_code)
CREATE OR REPLACE FUNCTION redeem_invite_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite RECORD;
  _student RECORD;
BEGIN
  -- Verify caller is parent
  IF get_user_role() IS NULL OR get_user_role() != 'parent' THEN
    RAISE EXCEPTION 'Only parents can redeem invite codes';
  END IF;

  -- Lock the invite row for atomicity
  SELECT * INTO _invite
  FROM invite_codes
  WHERE code = upper(p_code)
  FOR UPDATE;

  -- Validate
  IF _invite IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF _invite.status != 'pending' THEN
    RAISE EXCEPTION 'Invite code has already been used or expired';
  END IF;

  IF _invite.expires_at < now() THEN
    -- Mark as expired
    UPDATE invite_codes SET status = 'expired' WHERE id = _invite.id;
    RAISE EXCEPTION 'Invite code has expired';
  END IF;

  -- Create parent-student link
  INSERT INTO parent_students (parent_id, student_id)
  VALUES (auth.uid(), _invite.student_id)
  ON CONFLICT (parent_id, student_id) DO NOTHING;

  -- Update invite code status
  UPDATE invite_codes
  SET status = 'used', used_by = auth.uid()
  WHERE id = _invite.id;

  -- Fetch student info for response
  SELECT id, full_name INTO _student
  FROM students
  WHERE id = _invite.student_id;

  RETURN json_build_object(
    'student_id', _student.id,
    'student_name', _student.full_name
  );
END;
$$;

-- 7.4 mark_assignment_reviewed(p_assignment_id)
CREATE OR REPLACE FUNCTION mark_assignment_reviewed(p_assignment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rows INT;
BEGIN
  -- Single query: update only if assignment exists AND parent is linked to student
  UPDATE assignments a
  SET parent_reviewed = true, parent_reviewed_at = now()
  FROM parent_students ps
  WHERE a.id = p_assignment_id
    AND ps.parent_id = auth.uid()
    AND ps.student_id = a.student_id;

  GET DIAGNOSTICS _rows = ROW_COUNT;

  IF _rows = 0 THEN
    -- Distinguish "not found" from "no access"
    IF NOT EXISTS (SELECT 1 FROM assignments WHERE id = p_assignment_id) THEN
      RAISE EXCEPTION 'Assignment not found';
    ELSE
      RAISE EXCEPTION 'You do not have access to this assignment';
    END IF;
  END IF;
END;
$$;

-- ============================================================
-- 8. AUTH TRIGGER
-- ============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 9. ENABLE RLS
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_excuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. RLS POLICIES
-- Note: (select auth.uid()) caches the call once per query
--       (select get_user_role()) caches role lookup per query
-- ============================================================

-- ---------- profiles ----------

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Teachers and admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ---------- students ----------

CREATE POLICY "Teachers and admins can view all students"
  ON students FOR SELECT
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Parents can view linked students"
  ON students FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT student_id FROM parent_students
      WHERE parent_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers and admins can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Teachers and admins can update students"
  ON students FOR UPDATE
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'))
  WITH CHECK ((select get_user_role()) IN ('teacher', 'admin'));

-- ---------- parent_students ----------

CREATE POLICY "Teachers and admins can view all parent_students"
  ON parent_students FOR SELECT
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Parents can view own links"
  ON parent_students FOR SELECT
  TO authenticated
  USING (parent_id = (select auth.uid()));

-- No INSERT policy — handled by redeem_invite_code() SECURITY DEFINER

-- ---------- invite_codes ----------

CREATE POLICY "Creators can view own invite codes"
  ON invite_codes FOR SELECT
  TO authenticated
  USING (created_by = (select auth.uid()));

CREATE POLICY "Admins can view all invite codes"
  ON invite_codes FOR SELECT
  TO authenticated
  USING ((select get_user_role()) = 'admin');

CREATE POLICY "Teachers and admins can insert invite codes"
  ON invite_codes FOR INSERT
  TO authenticated
  WITH CHECK ((select get_user_role()) IN ('teacher', 'admin'));

-- ---------- assignments ----------

CREATE POLICY "Teachers can view all assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Parents can view linked student assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT student_id FROM parent_students
      WHERE parent_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can insert assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Teachers can update assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'))
  WITH CHECK ((select get_user_role()) IN ('teacher', 'admin'));

-- Parent update restricted to mark_assignment_reviewed() function

CREATE POLICY "Teachers can delete assignments"
  ON assignments FOR DELETE
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'));

-- ---------- behavior_logs ----------

CREATE POLICY "Teachers can view all behavior logs"
  ON behavior_logs FOR SELECT
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Parents can view linked student behavior logs"
  ON behavior_logs FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT student_id FROM parent_students
      WHERE parent_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can insert behavior logs"
  ON behavior_logs FOR INSERT
  TO authenticated
  WITH CHECK ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Teachers can update behavior logs"
  ON behavior_logs FOR UPDATE
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'))
  WITH CHECK ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Teachers can delete behavior logs"
  ON behavior_logs FOR DELETE
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'));

-- ---------- attendance ----------

CREATE POLICY "Teachers can view all attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Parents can view linked student attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT student_id FROM parent_students
      WHERE parent_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can insert attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Teachers can update attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'))
  WITH CHECK ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Teachers can delete attendance"
  ON attendance FOR DELETE
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'));

-- ---------- absence_excuses ----------

CREATE POLICY "Teachers and admins can view all absence excuses"
  ON absence_excuses FOR SELECT
  TO authenticated
  USING ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Parents can view own absence excuses"
  ON absence_excuses FOR SELECT
  TO authenticated
  USING (parent_id = (select auth.uid()));

CREATE POLICY "Parents can insert absence excuses for linked students"
  ON absence_excuses FOR INSERT
  TO authenticated
  WITH CHECK (
    (select get_user_role()) = 'parent'
    AND parent_id = (select auth.uid())
    AND student_id IN (
      SELECT student_id FROM parent_students
      WHERE parent_id = (select auth.uid())
    )
  );

-- ---------- conversations ----------

CREATE POLICY "Participants can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers and admins can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Participants can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (select auth.uid())
    )
  );

-- ---------- conversation_participants ----------

CREATE POLICY "Participants can view members of their conversations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers and admins can add participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK ((select get_user_role()) IN ('teacher', 'admin'));

CREATE POLICY "Users can update own participation"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ---------- messages ----------

CREATE POLICY "Participants can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid())
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (select auth.uid())
    )
  );

-- Note: Postgres RLS cannot restrict by column. App code must only update is_read.
-- For stronger enforcement, replace with a SECURITY DEFINER function in the future.
CREATE POLICY "Participants can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (select auth.uid())
    )
  );

-- ---------- teacher_availability ----------

CREATE POLICY "Authenticated users can view teacher availability"
  ON teacher_availability FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can insert own availability"
  ON teacher_availability FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = (select auth.uid()));

CREATE POLICY "Teachers can update own availability"
  ON teacher_availability FOR UPDATE
  TO authenticated
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));

CREATE POLICY "Teachers can delete own availability"
  ON teacher_availability FOR DELETE
  TO authenticated
  USING (teacher_id = (select auth.uid()));

-- ---------- meeting_bookings ----------

CREATE POLICY "Teachers can view own meeting bookings"
  ON meeting_bookings FOR SELECT
  TO authenticated
  USING (teacher_id = (select auth.uid()));

CREATE POLICY "Parents can view own meeting bookings"
  ON meeting_bookings FOR SELECT
  TO authenticated
  USING (parent_id = (select auth.uid()));

CREATE POLICY "Admins can view all meeting bookings"
  ON meeting_bookings FOR SELECT
  TO authenticated
  USING ((select get_user_role()) = 'admin');

CREATE POLICY "Parents can book meetings for linked students"
  ON meeting_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = (select auth.uid())
    AND student_id IN (
      SELECT student_id FROM parent_students
      WHERE parent_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can update own meeting bookings"
  ON meeting_bookings FOR UPDATE
  TO authenticated
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));

CREATE POLICY "Parents can update own meeting bookings"
  ON meeting_bookings FOR UPDATE
  TO authenticated
  USING (parent_id = (select auth.uid()))
  WITH CHECK (parent_id = (select auth.uid()));

CREATE POLICY "Admins can update any meeting booking"
  ON meeting_bookings FOR UPDATE
  TO authenticated
  USING ((select get_user_role()) = 'admin')
  WITH CHECK ((select get_user_role()) = 'admin');

CREATE POLICY "Admins can delete meeting bookings"
  ON meeting_bookings FOR DELETE
  TO authenticated
  USING ((select get_user_role()) = 'admin');

-- ---------- push_tokens ----------

CREATE POLICY "Users can manage own push tokens"
  ON push_tokens
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- 11. REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
