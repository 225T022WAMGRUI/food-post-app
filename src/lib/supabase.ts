import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  comment: string;
  location: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
  like_count?: number;
  is_liked?: boolean;
  comment_count?: number;
}

export interface Profile {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  follower_count?: number;
  following_count?: number;
  is_following?: boolean;
  is_friend?: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

// --- Auth ---

export async function signUp(email: string, password: string, username: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No user returned from signup');

  // Wait for session to be established
  await supabase.auth.getSession();

  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{ id: authData.user.id, username, avatar_url: null }]);

  if (profileError) throw profileError;
  return authData.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Ensure session is refreshed after sign in
  await supabase.auth.getSession();

  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// --- Profile ---

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(userId: string, updates: Partial<Pick<Profile, 'username' | 'bio' | 'avatar_url'>>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function uploadAvatar(file: File): Promise<string> {
  // Get current user from auth to ensure we use the correct user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop() || 'jpg';
  const safeName = `${user.id}/${user.id}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(safeName, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(safeName);
  return data.publicUrl;
}

// --- Follows ---

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function isMutualFollow(userIdA: string, userIdB: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .or(`and(follower_id.eq.${userIdA},following_id.eq.${userIdB}),and(follower_id.eq.${userIdB},following_id.eq.${userIdA})`);

  if (error) throw error;
  return data?.length === 2;
}

export async function getFollowerCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) throw error;
  return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) throw error;
  return count ?? 0;
}

// --- Likes ---

export async function likePost(postId: string): Promise<void> {
  // Get current user from auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('likes')
    .insert({ user_id: user.id, post_id: postId });

  if (error) throw error;
}

export async function unlikePost(postId: string): Promise<void> {
  // Get current user from auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', user.id)
    .eq('post_id', postId);

  if (error) throw error;
}

export async function isPostLiked(postId: string): Promise<boolean> {
  // Get current user from auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getPostLikeCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) throw error;
  return count ?? 0;
}

// --- Comments ---

export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Comment[];
}

export async function addComment(postId: string, content: string): Promise<Comment> {
  // Get current user from auth to ensure correct identity
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: user.id, post_id: postId, content })
    .select('*, profiles(username, avatar_url)')
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

export async function getPostCommentCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) throw error;
  return count ?? 0;
}

// --- Posts ---

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Post[];
}

export async function getUserPosts(userId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(username, avatar_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Post[];
}

export async function createPost(post: { image_url: string; comment: string; location: string; tags: string[] }): Promise<Post> {
  // Get current user from auth to ensure we use the correct user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .insert([{ ...post, user_id: user.id }])
    .select('*, profiles(username, avatar_url)')
    .single();

  if (error) throw error;
  return data as Post;
}

export async function deletePost(postId: string, imageUrl?: string) {
  // Delete associated image from storage
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      // Path is everything after /storage/v1/object/public/food-images/
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/food-images\/(.+)/);
      if (pathMatch?.[1]) {
        await supabase.storage
          .from('food-images')
          .remove([decodeURIComponent(pathMatch[1])]);
      }
    } catch {
      // Non-critical: don't block post deletion if image removal fails
    }
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

// --- Tags ---

export async function getTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

// --- Image Upload ---

export async function uploadImage(file: File): Promise<string> {
  // Get current user from auth to ensure we use the correct user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop() || 'jpg';
  const safeName = `${user.id}/${user.id}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('food-images')
    .upload(safeName, file);

  if (error) throw error;

  const { data } = supabase.storage.from('food-images').getPublicUrl(safeName);
  return data.publicUrl;
}
