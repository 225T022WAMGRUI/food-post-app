/*
  # Fix Comments Foreign Key for Profile Join

  The problem:
  - comments.user_id references auth.users(id)
  - Frontend query: select('*, profiles(username, avatar_url)')
  - Supabase cannot join because there's no FK from comments.user_id to profiles.id

  Solution:
  - Change comments.user_id to reference profiles.id instead
  - profiles.id already references auth.users(id), so cascade still works
*/

-- Drop the existing foreign key constraint
ALTER TABLE public.comments 
DROP CONSTRAINT comments_user_id_fkey;

-- Add new foreign key to profiles.id
ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
ON DELETE CASCADE;