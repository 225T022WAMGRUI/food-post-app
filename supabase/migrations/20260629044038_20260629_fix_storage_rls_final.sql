/*
  # Fix Storage RLS Policies for Avatars and Food Images

  The issue: INSERT policies using storage.foldername() function may not work
  correctly during the INSERT operation. We need simpler, more reliable policies.

  Solution: Use path-based checks with LIKE pattern matching which is more reliable.

  For INSERT: Allow if the path starts with the user's ID (e.g., avatars/user_id/...)
  For SELECT: Allow public read since buckets are public
  For UPDATE/DELETE: Allow only if owner_id matches (set by Supabase after upload)
*/

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload food images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own food images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own food images" ON storage.objects;

-- ============================================
-- PUBLIC SELECT POLICY
-- Since buckets are marked as public, allow anyone to read
-- ============================================
CREATE POLICY "Public can view storage objects"
  ON storage.objects FOR SELECT
  TO public
  USING (true);

-- ============================================
-- AVATARS BUCKET POLICIES
-- ============================================

-- INSERT: Allow authenticated users to upload to avatars/{their_user_id}/
CREATE POLICY "Users can upload avatars to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND name LIKE auth.uid()::text || '/%'
  );

-- UPDATE: Allow users to update their own avatar files
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (owner_id = auth.uid()::text OR name LIKE auth.uid()::text || '/%')
  );

-- DELETE: Allow users to delete their own avatar files
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (owner_id = auth.uid()::text OR name LIKE auth.uid()::text || '/%')
  );

-- ============================================
-- FOOD-IMAGES BUCKET POLICIES
-- ============================================

-- INSERT: Allow authenticated users to upload to food-images/{their_user_id}/
CREATE POLICY "Users can upload food images to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'food-images' 
    AND name LIKE auth.uid()::text || '/%'
  );

-- UPDATE: Allow users to update their own food image files
CREATE POLICY "Users can update own food images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'food-images' 
    AND (owner_id = auth.uid()::text OR name LIKE auth.uid()::text || '/%')
  );

-- DELETE: Allow users to delete their own food image files
CREATE POLICY "Users can delete own food images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'food-images' 
    AND (owner_id = auth.uid()::text OR name LIKE auth.uid()::text || '/%')
  );