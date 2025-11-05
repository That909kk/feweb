import React, { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { uploadBookingImageApi } from '../api/booking';

interface ImageUploadProps {
  bookingId?: string;
  onImageUploaded: (imageUrl: string, file?: File) => void; // Thêm file parameter
  currentImageUrl?: string;
  onRemoveImage?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  bookingId,
  onImageUploaded,
  currentImageUrl,
  onRemoveImage,
  disabled = false,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn file hình ảnh (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploadError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      
      // If no bookingId, pass the data URL AND File object to parent
      if (!bookingId) {
        onImageUploaded(dataUrl, file); // Trả về cả dataUrl (preview) và File object
      }
    };
    reader.readAsDataURL(file);

    // Upload file to server if bookingId is provided
    if (bookingId) {
      setIsUploading(true);

      try {
        const response = await uploadBookingImageApi(bookingId, file);
        if (response.success && response.data) {
          onImageUploaded(response.data.imageUrl, file);
          setPreviewUrl(response.data.imageUrl);
        } else {
          setUploadError('Tải ảnh lên thất bại');
          setPreviewUrl(null);
        }
      } catch (error: any) {
        console.error('Error uploading image:', error);
        setUploadError(error.message || 'Có lỗi xảy ra khi tải ảnh lên');
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemoveImage?.();
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {!previewUrl ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isUploading}
          className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-600">Đang tải ảnh lên...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Nhấn để tải ảnh lên
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG hoặc GIF (tối đa 5MB)
                </p>
              </div>
            </>
          )}
        </button>
      ) : (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full max-w-md rounded-lg shadow-md object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://via.placeholder.com/300x200?text=Invalid+Image';
            }}
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <ImageIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {!previewUrl && !uploadError && (
        <p className="text-xs text-gray-500 text-center">
          Thêm hình ảnh sẽ giúp bài đăng của bạn thu hút hơn
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
