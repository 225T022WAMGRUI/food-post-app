import { useState, useRef, useEffect } from 'react';
import { getProfile, updateProfile, uploadAvatar, getCurrentUser } from '../lib/supabase';
import { Camera, ImagePlus, X, ArrowLeft, Check } from 'lucide-react';
import AvatarCropModal from './AvatarCropModal';

interface EditProfileProps {
  userId: string;
  onBack: () => void;
  onSaved: (profile: any) => void;
}

export default function EditProfile({ userId, onBack, onSaved }: EditProfileProps) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Load profile on mount - use effect to prevent race conditions
  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      // Verify current user matches the userId prop
      const currentUser = await getCurrentUser();
      if (!mounted) return;

      if (!currentUser) {
        setInitialLoading(false);
        return;
      }

      const profile = await getProfile(currentUser.id);
      if (!mounted) return;

      if (profile) {
        setUsername(profile.username || '');
        setBio(profile.bio || '');
        setAvatarUrl(profile.avatar_url || '');
        if (profile.avatar_url) {
          setPreview(profile.avatar_url);
        }
      }
      setInitialLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCropImageSrc(dataUrl);
      };
      reader.readAsDataURL(file);
    }
    setShowUploadOptions(false);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    const croppedFile = new File([croppedImageBlob], 'avatar-cropped.jpg', { type: 'image/jpeg' });
    setAvatarFile(croppedFile);
    setCropImageSrc(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(croppedFile);
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setPreview('');
    setAvatarUrl('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Get current user from auth to ensure correct identity
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('認証されていません');
      }

      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(avatarFile);
      }

      const updated = await updateProfile(currentUser.id, {
        username: username.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatarUrl || null,
      });

      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#7a6f67] text-sm">読み込み中...</p>
      </div>
    );
  }

  // Show crop modal if image is selected
  if (cropImageSrc) {
    return (
      <AvatarCropModal
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
    );
  }

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 bg-[#faf8f4] border-b border-[#f3ede4] flex-shrink-0 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0e0d0] transition">
          <ArrowLeft size={22} className="text-[#9A7B5F]" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif text-lg text-[#2d2520] tracking-wider flex-1">プロフィール編集</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#9A7B5F] text-white hover:bg-[#8a6d52] disabled:opacity-50 transition"
        >
          <Check size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-8 flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-6">
            {preview ? (
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-md">
                <img src={preview} alt="avatar" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#f0e0d0] flex items-center justify-center shadow-md">
                <span className="text-4xl">🧑</span>
              </div>
            )}

            {preview && (
              <button
                type="button"
                onClick={removeAvatar}
                className="absolute -top-1 -right-1 w-6 h-6 bg-[#2d2520] rounded-full flex items-center justify-center text-white shadow-sm"
              >
                <X size={12} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowUploadOptions(true)}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#9A7B5F] rounded-full flex items-center justify-center text-white shadow-md border-2 border-[#faf8f4]"
            >
              <Camera size={15} strokeWidth={1.5} />
            </button>
          </div>

          <p className="text-xs text-[#b0a89f] tracking-wider mb-6">タップして写真を変更</p>
        </div>

        {/* Form */}
        <div className="px-5 space-y-5 pb-8">
          <div>
            <label className="block text-xs text-[#b0a89f] tracking-wider font-medium mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="hana_kitchen"
              maxLength={20}
              className="w-full bg-white border border-[#ede8e0] rounded-2xl px-4 py-3 text-sm text-[#2d2520] placeholder-[#b0a89f] focus:border-[#c8956c] focus:outline-none transition"
            />
            <p className="text-right text-xs text-[#b0a89f] mt-1">{username.length}/20</p>
          </div>

          <div>
            <label className="block text-xs text-[#b0a89f] tracking-wider font-medium mb-2">
              自己紹介
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="京都在住。毎日ごはん記録してます。"
              maxLength={120}
              className="w-full bg-white border border-[#ede8e0] rounded-2xl px-4 py-3 text-sm text-[#2d2520] placeholder-[#b0a89f] focus:border-[#c8956c] focus:outline-none transition resize-none h-24"
            />
            <p className="text-right text-xs text-[#b0a89f] mt-1">{bio.length}/120</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-[#9A7B5F] text-white rounded-3xl py-4 font-serif text-sm tracking-wider hover:bg-[#8a6d52] disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Check size={16} strokeWidth={2} />
            {loading ? '保存中...' : '保存する'}
          </button>
        </div>
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
    </>
  );
}
