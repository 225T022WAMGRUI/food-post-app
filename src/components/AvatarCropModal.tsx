import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getCroppedImg } from '../lib/cropImage';

interface AvatarCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

export default function AvatarCropModal({ imageSrc, onCropComplete, onCancel }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation: number) => {
    setRotation(rotation);
  }, []);

  const onCropCompleteInternal = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedImageBlob);
    } catch (error) {
      console.error('Failed to crop image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 1));
  };

  const handleResetRotation = () => {
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2d2520] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
        >
          <X size={24} className="text-white" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif text-lg text-white tracking-wider">切り抜き</h1>
        <div className="w-10" />
      </div>

      {/* Crop area */}
      <div className="flex-1 relative bg-[#1a1512]">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onRotationChange={onRotationChange}
          onCropComplete={onCropCompleteInternal}
          style={{
            containerStyle: {
              width: '100%',
              height: '100%',
              backgroundColor: '#1a1512',
            },
            cropAreaStyle: {
              border: '2px solid rgba(255, 255, 255, 0.3)',
            },
          }}
        />
      </div>

      {/* Circular preview */}
      <div className="flex justify-center items-center gap-8 py-5 bg-[#2d2520] flex-shrink-0">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-[#1a1512] bg-cover bg-center"
            style={{ backgroundImage: `url(${imageSrc})` }}
          />
          <p className="text-[10px] text-white/60 mt-2 tracking-wider">プレビュー</p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-[#2d2520] flex-shrink-0 space-y-4">
        {/* Zoom and rotation controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <ZoomOut size={20} className="text-white" strokeWidth={1.5} />
          </button>
          <div className="flex-1 max-w-[200px]">
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <ZoomIn size={20} className="text-white" strokeWidth={1.5} />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 bg-white/10 text-white rounded-2xl py-3.5 text-sm font-medium tracking-wider hover:bg-white/20 disabled:opacity-50 transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="flex-1 bg-[#9A7B5F] text-white rounded-2xl py-3.5 text-sm font-medium tracking-wider hover:bg-[#8a6d52] disabled:opacity-50 transition"
          >
            {isProcessing ? '処理中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
