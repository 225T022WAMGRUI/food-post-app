/*
  # Fix storage RLS policies for new user uploads

  The owner_id column may not be populated until after the INSERT check.
  For INSERT, we'll use both owner_id AND path-based checks for maximum compatibility.
  For UPDATE/DELETE, owner_id should already be set, so we keep those checks.
*/

-- Drop existing avatar policies
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Create new avatar INSERT policy - allow both path-based OR owner_id check
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (
      owner_id = auth.uid()::text 
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- UPDATE and DELETE can use owner_id since it's set by then
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

-- Create new food-images INSERT policy - allow both path-based OR owner_id check
CREATE POLICY "Authenticated users can upload food images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'food-images' 
    AND (
      owner_id = auth.uid()::text 
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own food images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'food-images' AND owner_id = auth.uid()::text);

CREATE POLICY "Users can delete own food images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'food-images' AND owner_id = auth.uid()::text);