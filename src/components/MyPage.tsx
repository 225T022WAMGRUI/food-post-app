import { useState, useEffect } from 'react';
import { getProfile, getUserPosts, getFollowerCount, getFollowingCount, signOut } from '../lib/supabase';
import { PenLine, LogOut, Users } from 'lucide-react';
import PostCard from './PostCard';
import EditProfile from './EditProfile';

interface MyPageProps {
  userId: string;
}

export default function MyPage({ userId }: MyPageProps) {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileData, postsData, followerC, followingC] = await Promise.all([
        getProfile(userId),
        getUserPosts(userId),
        getFollowerCount(userId),
        getFollowingCount(userId),
      ]);
      setProfile(profileData);
      setPosts(postsData);
      setFollowerCount(followerC);
      setFollowingCount(followingC);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleProfileSaved = (updated: any) => {
    setProfile(updated);
    setEditing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#b0a89f] text-sm">読み込み中...</p>
      </div>
    );
  }

  if (editing) {
    return (
      <EditProfile
        userId={userId}
        onBack={() => setEditing(false)}
        onSaved={handleProfileSaved}
      />
    );
  }

  return (
    <>
      {/* Header */}
      <div className="px-5 py-4 bg-[#faf8f4] flex-shrink-0">
        <h1 className="font-serif text-2xl font-light text-[#2d2520] tracking-wider">マイページ</h1>
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
            <h2 className="font-serif text-xl text-[#2d2520] tracking-wider mb-1">
              {profile?.username || 'User'}
            </h2>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-sm text-[#7a6f67] text-center leading-relaxed max-w-[260px] mt-2 mb-4">
                {profile.bio}
              </p>
            )}

            {/* Edit profile button */}
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-[#fdf8f0] border border-[#dcc9b4] rounded-full px-5 py-2.5 text-xs text-[#9A7B5F] font-medium tracking-wider hover:bg-[#f8f0e4] hover:border-[#c8b8a8] transition"
            >
              <PenLine size={14} strokeWidth={1.5} />
              プロフィール編集
            </button>
          </div>

          {/* Stats */}
          <div className="flex border-t border-[#f3ede4] border-b border-[#f3ede4]">
            <div className="flex-1 flex flex-col items-center py-5 border-r border-[#f3ede4]">
              <p className="font-serif text-2xl font-light text-[#2d2520]">{posts.length}</p>
              <p className="text-[10px] text-[#b0a89f] tracking-wider mt-1">投稿</p>
            </div>
            <div className="flex-1 flex flex-col items-center py-5 border-r border-[#f3ede4]">
              <p className="font-serif text-2xl font-light text-[#2d2520]">{followingCount}</p>
              <p className="text-[10px] text-[#b0a89f] tracking-wider mt-1">フォロー</p>
            </div>
            <div className="flex-1 flex flex-col items-center py-5">
              <p className="font-serif text-2xl font-light text-[#2d2520]">{followerCount}</p>
              <p className="text-[10px] text-[#b0a89f] tracking-wider mt-1">フォロワー</p>
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
                  className="aspect-square bg-[#f5ede3] flex items-center justify-center overflow-hidden relative group cursor-pointer"
                >
                  {post.image_url ? (
                    <img src={post.image_url} alt="post" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <span className="text-3xl opacity-40">🍽️</span>
                  )}
                  <div className="absolute inset-0 bg-[#2d2520]/0 group-hover:bg-[#2d2520]/10 transition duration-200" />
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
                  currentUserId={userId}
                  isOwnPost={true}
                  onDeleted={loadData}
                />
              </div>
            ))}
          </div>
        )}

        {posts.length === 0 && (
          <div className="text-center py-16 px-6">
            <p className="text-5xl mb-4 opacity-50">🍽️</p>
            <p className="font-serif text-sm text-[#2d2520] mb-1">まだ投稿がありません</p>
            <p className="text-xs text-[#b0a89f]">最初のごはんを記録してみましょう</p>
          </div>
        )}

        {/* Sign out */}
        <div className="px-4 py-6 border-t border-[#f3ede4] mt-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-white border border-[#e8e4de] rounded-2xl py-3.5 text-sm text-[#9A7B5F] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"
          >
            <LogOut size={16} strokeWidth={1.5} />
            ログアウト
          </button>
        </div>
      </div>
    </>
  );
}
