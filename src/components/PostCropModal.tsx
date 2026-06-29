import { useState, useCallback, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check, RotateCw } from 'lucide-react';
import { getCroppedPostImg } from '../lib/cropImage';

interface PostCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}

export default function PostCropModal({ imageSrc, onCropComplete, onCancel }: PostCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate preview when crop area changes (debounced)
  useEffect(() => {
    if (!croppedAreaPixels) return;

    const timeoutId = setTimeout(async () => {
      try {
        const blob = await getCroppedPostImg(imageSrc, croppedAreaPixels, rotation, true);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        console.error('Preview generation failed:', err);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [croppedAreaPixels, rotation, imageSrc]);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteInternal = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      // Generate high quality final image
      const croppedImageBlob = await getCroppedPostImg(imageSrc, croppedAreaPixels, rotation, false);
      const finalPreviewUrl = URL.createObjectURL(croppedImageBlob);
      onCropComplete(croppedImageBlob, finalPreviewUrl);
    } catch (error) {
      console.error('Failed to crop image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.15, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.15, 1));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1512] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 bg-[#2d2520]">
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
        >
          <X size={24} className="text-white" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif text-lg text-white tracking-wider">写真を編集</h1>
        <button
          onClick={handleConfirm}
          disabled={isProcessing || !croppedAreaPixels}
          className="text-sm font-medium text-[#c8956c] hover:text-[#daa67d] disabled:opacity-50 transition px-3"
        >
          {isProcessing ? '処理中...' : '次へ'}
        </button>
      </div>

      {/* Crop area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="rect"
          showGrid={true}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteInternal}
          style={{
            containerStyle: {
              width: '100%',
              height: '100%',
              backgroundColor: '#1a1512',
            },
            cropAreaStyle: {
              border: '2px solid rgba(255, 255, 255, 0.5)',
            },
          }}
        />
      </div>

      {/* Preview and controls section */}
      <div className="bg-[#2d2520] flex-shrink-0">
        {/* Square preview */}
        <div className="flex justify-center items-center py-4">
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/20 bg-[#1a1512] bg-cover bg-center shadow-lg"
              style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
            >
              {!previewUrl && (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white/30 text-xs">...</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-white/50 mt-2 tracking-wider">プレビュー</p>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-6 pt-2 space-y-4">
          {/* Zoom slider */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition active:scale-95"
            >
              <ZoomOut size={20} className="text-white" strokeWidth={1.5} />
            </button>
            <div className="flex-1 max-w-[220px]">
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition active:scale-95"
            >
              <ZoomIn size={20} className="text-white" strokeWidth={1.5} />
            </button>
          </div>

          {/* Rotate and confirm buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleRotate}
              disabled={isProcessing}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition active:scale-95"
            >
              <RotateCw size={22} className="text-white" strokeWidth={1.5} />
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing || !croppedAreaPixels}
              className="flex-1 bg-[#c8956c] text-white rounded-2xl py-3.5 text-sm font-medium tracking-wider hover:bg-[#d9956c] disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Check size={18} strokeWidth={2} />
              {isProcessing ? '処理中...' : '確定'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
