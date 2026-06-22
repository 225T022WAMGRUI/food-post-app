/*
  # Add social features: follows, likes, comments

  1. New Tables
    - `follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, references auth.users) - user who follows
      - `following_id` (uuid, references auth.users) - user being followed
      - `created_at` (timestamptz)
      - Unique constraint on (follower_id, following_id)
    - `likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - user who liked
      - `post_id` (uuid, references posts) - post being liked
      - `created_at` (timestamptz)
      - Unique constraint on (user_id, post_id)
    - `comments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - commenter
      - `post_id` (uuid, references posts) - post being commented on
      - `content` (text) - comment text
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all three tables
    - Follows: users can read all, create/delete own follows
    - Likes: users can read all, create/delete own likes
    - Comments: users can read all, create own comments, delete own comments

  3. Indexes
    - follows: index on follower_id, following_id
    - likes: index on post_id, user_id
    - comments: index on post_id
*/

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like posts"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 200),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
