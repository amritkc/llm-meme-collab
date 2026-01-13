-- ===================================================================
-- Create meme_reviews table to store ratings from participants
-- Each participant reviews 30 memes (10 per topic)
-- ===================================================================

CREATE TABLE IF NOT EXISTS meme_reviews (
  id BIGSERIAL PRIMARY KEY,
  
  -- Meme identification
  submission_id BIGINT,
  topic_id TEXT,
  template_id TEXT,
  variation_number INTEGER,
  task TEXT, -- 'ai', 'human', or 'aiHumanrefined'
  
  -- Participant information
  submission_participant_id TEXT, -- Who created the meme
  reviewer_participant_id TEXT NOT NULL, -- Who is reviewing it
  
  -- Rating dimensions (1-5 scale)
  humor INTEGER NOT NULL CHECK (humor >= 1 AND humor <= 5),
  shareability INTEGER NOT NULL CHECK (shareability >= 1 AND shareability <= 5),
  creativity INTEGER NOT NULL CHECK (creativity >= 1 AND creativity <= 5),
  
  -- Meme content (for reference)
  image_url TEXT,
  caption TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure each reviewer rates each meme only once
  UNIQUE(reviewer_participant_id, topic_id, variation_number)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_meme_reviews_reviewer ON meme_reviews(reviewer_participant_id);
CREATE INDEX IF NOT EXISTS idx_meme_reviews_topic ON meme_reviews(topic_id);
CREATE INDEX IF NOT EXISTS idx_meme_reviews_variation ON meme_reviews(topic_id, variation_number);
CREATE INDEX IF NOT EXISTS idx_meme_reviews_submission ON meme_reviews(submission_id);

-- ===================================================================
-- Verify the setup
-- ===================================================================

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'meme_reviews'
ORDER BY ordinal_position;

-- Check reviews count
SELECT COUNT(*) as total_reviews FROM meme_reviews;

-- Check reviews per participant
SELECT 
  reviewer_participant_id, 
  COUNT(*) as reviews_count,
  AVG(humor) as avg_humor,
  AVG(shareability) as avg_shareability,
  AVG(creativity) as avg_creativity
FROM meme_reviews
GROUP BY reviewer_participant_id
ORDER BY reviews_count DESC;

-- Check reviews per topic
SELECT 
  topic_id,
  COUNT(*) as reviews_count,
  AVG(humor) as avg_humor,
  AVG(shareability) as avg_shareability,
  AVG(creativity) as avg_creativity
FROM meme_reviews
GROUP BY topic_id
ORDER BY topic_id;
