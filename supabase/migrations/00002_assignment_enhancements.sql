-- Assignment enhancements: detailed grading fields and student progress tracking
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS mistakes INT DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS pauses INT DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS pages_completed NUMERIC(4,1) DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS recited_to UUID REFERENCES profiles(id);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS next_assignment TEXT;

ALTER TABLE students ADD COLUMN IF NOT EXISTS arabic_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_surah TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_juz INT;

CREATE INDEX IF NOT EXISTS idx_assignments_recited_to ON assignments (recited_to);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments (date);
