/*
  # Create initial schema for Gohan App
  
  1. New Tables
    - `profiles` - User profiles
      - `id` (uuid, primary key, linked to auth.users)
      - `username` (text, unique)
      - `bio` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `posts` - Food posts
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `image_url` (text)
      - `comment` (text)
      - `location` (text)
      - `tags` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `tags` - Available tags for categorization
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Users can view all posts and profiles (public read)
    - Users can only create/update their own posts
    - Users can only update their own profile
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  bio text DEFAULT '',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text,
  comment text DEFAULT '',
  location text DEFAULT '',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- Insert default tags
INSERT INTO tags (name) VALUES
  ('ランチ'),
  ('夜ごはん'),
  ('朝ごはん'),
  ('深夜ごはん'),
  ('ひとりごはん'),
  ('自炊'),
  ('コンビニ'),
  ('スイーツ'),
  ('ラーメン'),
  ('カフェ'),
  ('定食'),
  ('パン'),
  ('カレー'),
  ('寿司'),
  ('週末ごはん')
ON CONFLICT (name) DO NOTHING;
