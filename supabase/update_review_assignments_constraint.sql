-- ===================================================================
-- Update review_assignments to support unlimited participants
-- Allow meme reuse: multiple participants can review the same meme
-- ===================================================================

-- 1. Drop the old UNIQUE constraint (if it exists)
ALTER TABLE review_assignments 
DROP CONSTRAINT IF EXISTS review_assignments_topic_id_variation_number_key;

-- 2. Add new UNIQUE constraint per participant
-- This prevents same participant from getting same meme twice
-- But allows different participants to review the same meme
ALTER TABLE review_assignments 
ADD CONSTRAINT review_assignments_reviewer_topic_variation_key 
UNIQUE (reviewer_participant_id, topic_id, variation_number);

-- 3. Verify the constraint
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'review_assignments'::regclass;
