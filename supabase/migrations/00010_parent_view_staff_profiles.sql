-- Allow parents to view teacher and admin profiles (for staff directory / messaging)
CREATE POLICY "Parents can view staff profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (select get_user_role()) = 'parent'
    AND role IN ('teacher', 'admin')
  );
