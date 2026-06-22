/*
  # Fix storage RLS policies to use owner_id

  The path-based checks using storage.foldername can be unreliable.
  The owner_id column is automatically populated by Supabase storage
  and provides a more reliable way to verify ownership.

  This fixes the "new row violates row-level security policy" error
  for newly created users uploading avatars.
*/

-- Drop existing avatar policies
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Create new avatar policies using owner_id
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND owner_id = auth.uid()::text);

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND owner_id = auth.uid()::text);

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND owner_id = auth.uid()::text);

-- Drop existing food-images policies
DROP POLICY IF EXISTS "Authenticated users can upload food images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own food images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own food images" ON storage.objects;

-- Create new food-images policies using owner_id
CREATE POLICY "Authenticated users can upload food images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'food-images' AND owner_id = auth.uid()::text);

CREATE POLICY "Users can update own food images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'food-images' AND owner_id = auth.uid()::text);

CREATE POLICY "Users can delete own food images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'food-images' AND owner_id = auth.uid()::text);