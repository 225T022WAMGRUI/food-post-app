import { useState, useRef, useEffect } from 'react';
import { Post, Comment, likePost, unlikePost, isPostLiked, getPostLikeCount, getComments, addComment, deleteComment, getPostCommentCount, deletePost } from '../lib/supabase';
import { MoreHorizontal, Trash2, Heart, MessageCircle, Send, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  isOwnPost: boolean;
  onDeleted?: () => void;
  onUserClick?: (userId: string) => void;
}

export default function PostCard({ post, currentUserId, isOwnPost, onDeleted, onUserClick }: PostCardProps) {
  const timeAgo = getTimeAgo(post.created_at);
  const username = post.profiles?.username || 'User';
  const avatarUrl = post.profiles?.avatar_url;

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [showFullCaption, setShowFullCaption] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Load like and comment counts
  useEffect(() => {
    isPostLiked(currentUserId, post.id).then(setLiked);
    getPostLikeCount(post.id).then(setLikeCount);
    getPostCommentCount(post.id).then(setCommentCount);
  }, [currentUserId, post.id]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleToggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      if (liked) {
        await unlikePost(currentUserId, post.id);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await likePost(currentUserId, post.id);
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const openComments = async () => {
    if (commentsOpen) {
      setCommentsOpen(false);
      return;
    }
    setCommentsOpen(true);
    try {
      const data = await getComments(post.id);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || commentLoading) return;
    setCommentLoading(true);
    try {
      const newComment = await addComment(currentUserId, post.id, text);
      setComments((prev) => [...prev, newComment]);
      setCommentCount((c) => c + 1);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(post.id, post.image_url || undefined);
      setConfirmOpen(false);
      setMenuOpen(false);
      onDeleted?.();
    } catch (err) {
      console.error('Failed to delete post:', err);
      setDeleting(false);
    }
  };

  const captionLength = post.comment?.length || 0;
  const shouldTruncate = captionLength > 80;
  const displayCaption = shouldTruncate && !showFullCaption
    ? post.comment?.slice(0, 80) + '...'
    : post.comment;

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => !isOwnPost && onUserClick?.(post.user_id)}
          className={`w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-[#f0e0d0] flex items-center justify-center ${!isOwnPost ? 'hover:ring-2 hover:ring-[#e8d5c5] transition' : ''}`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg opacity-60">👋</span>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => !isOwnPost && onUserClick?.(post.user_id)}
            className={`text-left ${!isOwnPost ? 'hover:opacity-70 transition' : ''}`}
          >
            <p className="text-sm font-medium text-[#2d2520] truncate">{username}</p>
          </button>
          <p className="text-[11px] text-[#b0a89f] mt-0.5">{timeAgo}</p>
        </div>

        {isOwnPost && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f5ede3] transition"
            >
              <MoreHorizontal size={20} className="text-[#9A7B5F]" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 bg-white border border-[#ede8e0] rounded-2xl shadow-lg py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => { setMenuOpen(false); setConfirmOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 size={15} />
                  削除する
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo - Larger */}
      {post.image_url ? (
        <div className="aspect-square bg-[#ede8e0]">
          <img src={post.image_url} alt="food" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-square bg-gradient-to-br from-[#f9ede0] to-[#f5d9b8] flex flex-col items-center justify-center gap-3">
          <span className="text-6xl opacity-50">🍽️</span>
          <span className="text-xs text-[#b0a89f]">写真なし</span>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-1">
        <button
          onClick={handleToggleLike}
          disabled={likeLoading}
          className="flex items-center gap-2 px-3 py-2.5 rounded-full hover:bg-[#fdf6ec] transition group"
        >
          <Heart
            size={22}
            className={`transition ${liked ? 'fill-[#e8a87c] text-[#e8a87c]' : 'text-[#b0a89f] group-hover:text-[#9A7B5F]'}`}
            strokeWidth={liked ? 0 : 1.5}
          />
          {likeCount > 0 && (
            <span className={`text-sm ${liked ? 'text-[#e8a87c] font-medium' : 'text-[#9A7B5F]'}`}>
              {likeCount}
            </span>
          )}
        </button>

        <button
          onClick={openComments}
          className="flex items-center gap-2 px-3 py-2.5 rounded-full hover:bg-[#fdf6ec] transition group"
        >
          <MessageCircle
            size={22}
            className={`text-[#b0a89f] group-hover:text-[#9A7B5F] transition ${commentsOpen ? 'text-[#9A7B5F]' : ''}`}
            strokeWidth={1.5}
          />
          {commentCount > 0 && (
            <span className="text-sm text-[#9A7B5F]">{commentCount}</span>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pb-4">
        {post.comment && (
          <div className="mb-3">
            <p className="font-serif text-sm text-[#2d2520] leading-relaxed whitespace-pre-wrap">
              {displayCaption}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-xs text-[#9A7B5F] mt-1.5 flex items-center gap-1 hover:opacity-70 transition"
              >
                {showFullCaption ? (
                  <>閉じる <ChevronUp size={12} /></>
                ) : (
                  <>続きを読む <ChevronDown size={12} /></>
                )}
              </button>
            )}
          </div>
        )}

        {post.location && (
          <div className="flex items-center gap-1.5 mb-3 text-[11px] text-[#7a6f67]">
            <MapPin size={13} className="text-[#9A7B5F]" />
            <span>{post.location}</span>
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="bg-[#f8f3ed] text-[#8b6a50] text-[11px] px-3 py-1.5 rounded-full font-light"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments section */}
      {commentsOpen && (
        <div className="border-t border-[#f3ede4] px-4 py-4">
          {comments.length > 0 && (
            <div className="space-y-3 mb-4 max-h-56 overflow-y-auto">
              {comments.map((c) => {
                const isOwnComment = c.user_id === currentUserId;
                return (
                  <div key={c.id} className="flex items-start gap-2.5 group">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-[#f0e0d0] flex items-center justify-center mt-0.5">
                      {c.profiles?.avatar_url ? (
                        <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] opacity-60">👋</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed">
                        <span className="font-medium text-[#2d2520]">{c.profiles?.username || 'User'}</span>
                        <span className="text-[#5a4d42] ml-2">{c.content}</span>
                      </p>
                      <p className="text-[10px] text-[#b0a89f] mt-0.5">{getTimeAgo(c.created_at)}</p>
                    </div>
                    {isOwnComment && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 transition text-[#b0a89f] hover:text-red-400 flex-shrink-0 mt-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment input */}
          <div className="flex items-center gap-2.5">
            <input
              ref={commentInputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="ひとことどうぞ..."
              maxLength={200}
              className="flex-1 bg-[#faf8f4] border border-[#ede8e0] rounded-full px-4 py-3 text-xs text-[#2d2520] placeholder-[#b0a89f] focus:border-[#c8a98a] focus:outline-none focus:ring-1 focus:ring-[#c8a98a]/30 transition"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || commentLoading}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f0e0d0] text-[#9A7B5F] hover:bg-[#e8d5c5] disabled:opacity-40 disabled:hover:bg-[#f0e0d0] transition flex-shrink-0"
            >
              <Send size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm px-6"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setConfirmOpen(false); }}
        >
          <div className="bg-[#faf8f4] rounded-3xl p-7 w-full max-w-[300px] shadow-2xl">
            <p className="font-serif text-base text-[#2d2520] text-center mb-2">投稿を削除しますか？</p>
            <p className="text-xs text-[#b0a89f] text-center mb-7">この操作は取り消せません</p>
            <div className="space-y-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full bg-red-500 text-white rounded-2xl py-3.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition"
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="w-full bg-white border border-[#ede8e0] rounded-2xl py-3.5 text-sm text-[#7a6f67] hover:bg-[#f5ede3] disabled:opacity-50 transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'たった今';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}時間前`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}日前`;

  return date.toLocaleDateString('ja-JP');
}
