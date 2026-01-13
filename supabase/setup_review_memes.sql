-- ===================================================================
-- Create review_memes table to store memes for participants to review
-- 180 total memes: 60 per topic (Student Life, Technology/AI, Daily Struggles)
-- 35 participants × 30 memes each (10 per topic)
-- ===================================================================

-- 1. Create the main review_memes table
CREATE TABLE IF NOT EXISTS review_memes (
  id BIGSERIAL PRIMARY KEY,
  topic_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template TEXT NOT NULL,
  caption TEXT,
  layers JSONB,
  image_path TEXT,
  image_url TEXT,
  task TEXT, -- 'ai' or 'human'
  variation_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add variation_number column if updating existing table
-- ALTER TABLE review_memes ADD COLUMN IF NOT EXISTS variation_number INTEGER;

-- 2. Create review_assignments table to track which memes are assigned to which reviewer
-- Each participant gets 10 memes per topic (30 total)
-- CHANGED: Removed global UNIQUE constraint to allow meme reuse across participants
CREATE TABLE IF NOT EXISTS review_assignments (
  id BIGSERIAL PRIMARY KEY,
  reviewer_participant_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  variation_number INTEGER NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure each participant doesn't get the SAME meme twice
  -- But multiple participants CAN review the same meme
  UNIQUE(reviewer_participant_id, topic_id, variation_number)
);

-- 3. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_review_memes_topic ON review_memes(topic_id);
CREATE INDEX IF NOT EXISTS idx_review_memes_variation ON review_memes(topic_id, variation_number);
CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer ON review_assignments(reviewer_participant_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_topic ON review_assignments(topic_id, variation_number);

-- ===================================================================
-- Example: Populate review_memes with variations (0-59) per topic
-- Total: 180 memes (60 per topic)
-- ===================================================================

-- If you're importing from existing meme_submissions:
-- INSERT INTO review_memes (topic_id, template_id, template, caption, layers, image_path, image_url, task, variation_number)
-- SELECT 
--   topic_id, 
--   template_id, 
--   'TemplateName', 
--   caption, 
--   layers, 
--   image_path, 
--   image_url, 
--   task,
--   ROW_NUMBER() OVER (PARTITION BY topic_id ORDER BY created_at) - 1 as variation_number
-- FROM meme_submissions
-- WHERE task = 'ai' OR task = 'human'
-- LIMIT 180; -- 60 variations × 3 topics

-- ===================================================================
-- Verify the setup
-- ===================================================================

-- Check review_memes count per topic
-- SELECT topic_id, COUNT(*), MIN(variation_number), MAX(variation_number) 
-- FROM review_memes 
-- GROUP BY topic_id;

-- Check assignments
-- SELECT * FROM review_assignments ORDER BY assigned_at DESC;
