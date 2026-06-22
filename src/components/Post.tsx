import { useState, useRef, useEffect } from 'react';
import { createPost, uploadImage, getTags } from '../lib/supabase';
import { Camera, ImagePlus, X } from 'lucide-react';

interface PostProps {
  userId: string;
  onSuccess: () => void;
}

export default function Post({ userId, onSuccess }: PostProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['ランチ']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showUploadOptions, setShowUploadOptions] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Load tags on mount
  useEffect(() => {
    getTags().then((data) => {
      setTags(data?.map((t: any) => t.name) || []);
    });
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    setShowUploadOptions(false);
  };

  const removeImage = () => {
    setImage(null);
    setPreview('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let imageUrl = '';
      if (image) {
        imageUrl = await uploadImage(image);
      }

      await createPost({
        image_url: imageUrl,
        comment,
        location,
        tags: selectedTags,
      });

      setComment('');
      setLocation('');
      setImage(null);
      setPreview('');
      setSelectedTags(['ランチ']);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#faf8f4] border-b border-[#f3ede4] flex-shrink-0">
        <h1 className="font-serif text-2xl font-light text-[#2d2520] tracking-wider">
          今日のごはんを記録する
        </h1>
        <p className="text-xs text-[#b0a89f] mt-0.5 tracking-wider">何を食べましたか？</p>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload area */}
          <div className="mx-4 mt-4">
            {preview ? (
              /* Image preview with remove button */
              <div className="relative rounded-3xl overflow-hidden shadow-sm">
                <img src={preview} alt="preview" className="w-full aspect-square object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent p-4 pt-10">
                  <p className="text-white text-xs font-medium tracking-wider">写真を変更するにはタップ</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadOptions(true)}
                  className="absolute inset-0 cursor-pointer"
                  aria-label="Change photo"
                />
              </div>
            ) : (
              /* Upload prompt */
              <button
                type="button"
                onClick={() => setShowUploadOptions(true)}
                className="w-full aspect-square border-2 border-dashed border-[#ede8e0] rounded-3xl flex flex-col items-center justify-center gap-3 bg-[#fdf6ec] cursor-pointer hover:bg-[#f5ede3] transition relative overflow-hidden group"
              >
                <div className="w-16 h-16 rounded-full bg-[#f0e0d0] flex items-center justify-center group-hover:scale-110 transition">
                  <Camera size={28} className="text-[#c8956c]" />
                </div>
                <span className="font-serif text-sm text-[#7a6f67]">写真を追加する</span>
                <span className="text-xs text-[#b0a89f] tracking-wider">カメラまたはアルバムから選ぶ</span>
              </button>
            )}
          </div>

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Upload options sheet */}
          {showUploadOptions && (
            <div
              className="fixed inset-0 z-50 bg-black/45 flex items-end backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowUploadOptions(false);
              }}
            >
              <div className="bg-[#faf8f4] rounded-t-3xl w-full p-6 pb-8">
                <div className="w-9 h-1 bg-[#ede8e0] rounded-sm mx-auto mb-6" />
                <p className="font-serif text-base text-[#2d2520] text-center mb-5">写真を選ぶ</p>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full bg-white border border-[#ede8e0] rounded-2xl p-4 flex items-center gap-4 hover:bg-[#fdf6ec] transition"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#f0e0d0] flex items-center justify-center flex-shrink-0">
                      <Camera size={22} className="text-[#c8956c]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#2d2520]">カメラで撮る</p>
                      <p className="text-xs text-[#b0a89f] mt-0.5">今すぐ写真を撮る</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full bg-white border border-[#ede8e0] rounded-2xl p-4 flex items-center gap-4 hover:bg-[#fdf6ec] transition"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#e8f0e8] flex items-center justify-center flex-shrink-0">
                      <ImagePlus size={22} className="text-[#8aab8a]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#2d2520]">アルバムから選ぶ</p>
                      <p className="text-xs text-[#b0a89f] mt-0.5">保存されている写真を選ぶ</p>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUploadOptions(false)}
                  className="w-full border border-[#ede8e0] rounded-2xl py-3 text-xs text-[#b0a89f] font-medium tracking-wider hover:bg-[#f5ede3] transition mt-4"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="px-4 space-y-3.5">
            {/* Comment */}
            <div>
              <label className="block text-xs text-[#b0a89f] tracking-wider font-medium mb-1.5">
                一言コメント
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="今日の食事はどうでしたか？ひとことどうぞ。"
                className="w-full bg-white border border-[#ede8e0] rounded-2xl px-3.5 py-3 text-sm text-[#2d2520] placeholder-[#b0a89f] focus:border-[#c8956c] focus:outline-none transition resize-none h-20"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs text-[#b0a89f] tracking-wider font-medium mb-1.5">
                お店・場所
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例：近所のカフェ、コンビニ、おうちごはん"
                className="w-full bg-white border border-[#ede8e0] rounded-2xl px-3.5 py-3 text-sm text-[#2d2520] placeholder-[#b0a89f] focus:border-[#c8956c] focus:outline-none transition"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs text-[#b0a89f] tracking-wider font-medium mb-2">
                タグを選ぶ
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      );
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full transition ${
                      selectedTags.includes(tag)
                        ? 'bg-[#f0e0d0] border border-[#c8956c] text-[#c8956c]'
                        : 'bg-white border border-[#ede8e0] text-[#7a6f67] hover:border-[#c8956c]'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-xs">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c8956c] text-white rounded-3xl py-4 font-serif text-sm tracking-wider hover:bg-[#b8845c] disabled:opacity-50 transition flex items-center justify-center gap-2 mt-6"
            >
              <span>🍽️</span>
              {loading ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
