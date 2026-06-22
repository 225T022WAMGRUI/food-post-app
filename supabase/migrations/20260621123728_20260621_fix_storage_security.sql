/*
  # Fix storage security: Remove broad SELECT policies

  Public buckets don't need SELECT policies for object URL access.
  Removing these prevents clients from listing all files in the bucket.
  Individual file access via public URLs still works.
*/

-- Drop the broad SELECT policy on avatars bucket
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

-- Drop the broad SELECT policy on food-images bucket  
DROP POLICY IF EXISTS "Food images are publicly viewable" ON storage.objects;