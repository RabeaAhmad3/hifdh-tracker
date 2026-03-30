ALTER TABLE teacher_availability ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX idx_teacher_availability_active ON teacher_availability (teacher_id, day_of_week) WHERE is_active = true;
CREATE INDEX idx_meeting_bookings_teacher_date ON meeting_bookings (teacher_id, date, status) WHERE status = 'confirmed';
