import { useState, useEffect, useCallback } from 'react';
import { getPosts, getTags, Post as PostType } from '../lib/supabase';
import { Sparkles } from 'lucide-react';
import PostCard from './PostCard';
import Suggestion from './Suggestion';

interface FeedProps {
  userId: string;
  refresh: number;
  onUserClick?: (userId: string) => void;
}

export default function Feed({ userId, refresh, onUserClick }: FeedProps) {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const postsData = await getPosts();
      setPosts(postsData);
    } catch (error) {
      console.error('Failed to load feed:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [postsData, tagsData] = await Promise.all([getPosts(), getTags()]);
        setPosts(postsData);
        setTags(tagsData);
      } catch (error) {
        console.error('Failed to load feed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refresh]);

  const handlePostDeleted = useCallback(() => {
    loadPosts();
  }, [loadPosts]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#b0a89f] text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="px-5 py-4 bg-[#faf8f4] flex-shrink-0">
        <h1 className="font-serif text-2xl font-light text-[#2d2520] tracking-wider">きょうのごはん</h1>
        <p className="text-[11px] text-[#b0a89f] mt-1 tracking-wider">みんなの今日の食卓</p>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto">
        {/* Suggestion bar */}
        <button
          onClick={() => setShowSuggestion(true)}
          className="mx-4 mt-4 bg-gradient-to-br from-[#fdf8f0] to-[#faede0] border border-[#e8d9c8] rounded-3xl p-4 flex items-center gap-3.5 cursor-pointer hover:shadow-md hover:border-[#dcc9b4] transition-all relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-[#f5d9b8]/30 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-[#f0e0d0] flex items-center justify-center flex-shrink-0">
            <Sparkles size={22} className="text-[#c8956c]" strokeWidth={1.5} />
          </div>
          <div className="flex-1 text-left relative z-10">
            <div className="text-[10px] text-[#b89a7a] font-medium tracking-widest uppercase">今日なに食べる？</div>
            <div className="font-serif text-sm text-[#2d2520] leading-tight mt-0.5">おすすめを見る</div>
          </div>
          <div className="text-xl text-[#c8956c] flex-shrink-0 relative z-10 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            ›
          </div>
        </button>

        {/* Feed list */}
        <div className="px-4 pt-5 pb-6 space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-16 px-6">
              <p className="text-5xl mb-4 opacity-50">🍽️</p>
              <p className="font-serif text-sm text-[#2d2520] mb-1">まだ投稿がありません</p>
              <p className="text-xs text-[#b0a89f]">最初のごはんを記録してみましょう</p>
            </div>
          ) : (
            posts.map((post, index) => (
              <div key={post.id}>
                {index === 0 && (
                  <div className="text-center text-[10px] text-[#b0a89f] tracking-wider mb-5 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#e8e4de] to-transparent"></div>
                    <span className="px-3">今日</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#e8e4de] to-transparent"></div>
                  </div>
                )}
                {index > 0 && index % 3 === 0 && (
                  <div className="text-center text-[10px] text-[#b0a89f] tracking-wider my-5 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#e8e4de] to-transparent"></div>
                    <span className="px-3">{getTimeLabel(posts[index - 1], post)}</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#e8e4de] to-transparent"></div>
                  </div>
                )}
                <PostCard
                  post={post}
                  currentUserId={userId}
                  isOwnPost={post.user_id === userId}
                  onDeleted={handlePostDeleted}
                  onUserClick={onUserClick}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Suggestion modal */}
      {showSuggestion && <Suggestion tags={tags} onClose={() => setShowSuggestion(false)} />}
    </>
  );
}

function getTimeLabel(prevPost: PostType, currentPost: PostType): string {
  const prevDate = new Date(prevPost.created_at).toDateString();
  const currDate = new Date(currentPost.created_at).toDateString();

  if (prevDate === currDate) return '';

  const now = new Date();
  const curr = new Date(currentPost.created_at);
  const diffDays = Math.floor((now.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '昨日';
  if (diffDays < 7) return `${diffDays日前}`;
  return curr.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}
