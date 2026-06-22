import { useState, useEffect } from 'react';
import { getProfile, getUserPosts, followUser, unfollowUser, isFollowing, isMutualFollow, getFollowerCount, getFollowingCount } from '../lib/supabase';
import { ArrowLeft, Users } from 'lucide-react';
import PostCard from './PostCard';

interface UserProfileProps {
  userId: string;
  currentUserId: string;
  onBack: () => void;
  onPostDeleted?: () => void;
}

export default function UserProfile({ userId, currentUserId, onBack, onPostDeleted }: UserProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [mutual, setMutual] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const isSelf = userId === currentUserId;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [profileData, postsData, isFollow, followerC, followingC] = await Promise.all([
          getProfile(userId),
          getUserPosts(userId),
          isSelf ? Promise.resolve(false) : isFollowing(currentUserId, userId),
          getFollowerCount(userId),
          getFollowingCount(userId),
        ]);

        setProfile(profileData);
        setPosts(postsData);
        setFollowing(isFollow);
        setFollowerCount(followerC);
        setFollowingCount(followingC);

        if (isFollow) {
          const isMutual = await isMutualFollow(currentUserId, userId);
          setMutual(isMutual);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId, currentUserId, isSelf]);

  const handleToggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUser(currentUserId, userId);
        setFollowing(false);
        setMutual(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        await followUser(currentUserId, userId);
        setFollowing(true);
        setFollowerCount((c) => c + 1);
        // Check if now mutual
        const isMutual = await isMutualFollow(currentUserId, userId);
        setMutual(isMutual);
      }
    } catch (err) {
      console.error('Follow toggle failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#b0a89f] text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 bg-[#faf8f4] border-b border-[#f3ede4] flex-shrink-0 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0e0d0] transition"
        >
          <ArrowLeft size={22} className="text-[#9A7B5F]" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif text-lg text-[#2d2520] tracking-wider flex-1">
          {profile?.username || 'User'}
        </h1>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile section */}
        <div className="bg-white">
          <div className="pt-8 pb-6 flex flex-col items-center relative">
            {/* Avatar - Larger */}
            <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg mb-4 bg-[#f0e0d0] flex items-center justify-center ring-4 ring-[#faf8f4]">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl opacity-60">👋</span>
              )}
            </div>

            {/* Username */}
            <h2 className="font-serif text-xl text-[#2d2520] tracking-wider mb-2">
              {profile?.username || 'User'}
            </h2>

            {/* Friend badge - Warm and welcoming */}
            {mutual && (
              <div className="flex items-center gap-2 bg-[#f8f3ed] border border-[#e8d9c8] text-[#8b7355] text-xs px-4 py-2 rounded-full mb-3 shadow-sm">
                <Users size={14} className="text-[#9A7B5F]" strokeWidth={1.5} />
                <span className="font-medium tracking-wide">友達</span>
              </div>
            )}

            {/* Bio */}
            {profile?.bio && (
              <p className="text-sm text-[#7a6f67] text-center leading-relaxed max-w-[260px] mt-2 mb-4">
                {profile.bio}
              </p>
            )}

            {/* Follow button */}
            {!isSelf && (
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`rounded-full px-7 py-3 text-xs font-medium tracking-wider transition ${
                  following
                    ? 'bg-white border-2 border-[#e8e4de] text-[#7a6f67] hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                    : 'bg-[#9A7B5F] text-white hover:bg-[#8a6d52] shadow-md'
                } disabled:opacity-50`}
              >
                {following ? 'フォロー中' : 'フォローする'}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex border-t border-[#f3ede4] border-b border-[#f3ede4]">
            <div className="flex-1 flex flex-col items-center py-5 border-r border-[#f3ede4]">
              <p className="font-serif text-2xl font-light text-[#2d2520]">{posts.length}</p>
              <p className="text-[10px] text-[#b0a89f] tracking-wider mt-1">投稿</p>
            </div>
            <div className="flex-1 flex flex-col items-center py-5 border-r border-[#f3ede4]">
              <p className="font-serif text-2xl font-light text-[#2d2520]">{followerCount}</p>
              <p className="text-[10px] text-[#b0a89f] tracking-wider mt-1">フォロワー</p>
            </div>
            <div className="flex-1 flex flex-col items-center py-5">
              <p className="font-serif text-2xl font-light text-[#2d2520]">{followingCount}</p>
              <p className="text-[10px] text-[#b0a89f] tracking-wider mt-1">フォロー</p>
            </div>
          </div>
        </div>

        {/* Photo grid */}
        {posts.length > 0 && (
          <div className="mt-3">
            <div className="px-4 py-3 flex items-center gap-2">
              <span className="text-lg">🍽️</span>
              <h3 className="font-serif text-sm text-[#2d2520] tracking-wider">ごはん記録</h3>
              <span className="text-xs text-[#b0a89f] ml-1">{posts.length}件</span>
            </div>
            <div className="grid grid-cols-3 gap-[3px] px-[3px]">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-[#f5ede3] flex items-center justify-center overflow-hidden"
                >
                  {post.image_url ? (
                    <img src={post.image_url} alt="post" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl opacity-40">🍽️</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent posts */}
        {posts.length > 0 && (
          <div className="px-4 pt-6 pb-5">
            <h3 className="font-serif text-sm text-[#2d2520] tracking-wider mb-4">最近の投稿</h3>
            {posts.slice(0, 2).map((post) => (
              <div key={post.id} className="mb-4 last:mb-0">
                <PostCard
                  post={post}
                  currentUserId={currentUserId}
                  isOwnPost={post.user_id === currentUserId}
                  onDeleted={onPostDeleted}
                />
              </div>
            ))}
          </div>
        )}

        {posts.length === 0 && (
          <div className="text-center py-16 px-6">
            <p className="text-5xl mb-4 opacity-50">🍽️</p>
            <p className="font-serif text-sm text-[#2d2520] mb-1">まだ投稿がありません</p>
            <p className="text-xs text-[#b0a89f]">ごはん記録を楽しみにしています</p>
          </div>
        )}
      </div>
    </>
  );
}
