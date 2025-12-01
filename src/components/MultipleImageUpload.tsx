import React, { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Plus } from 'lucide-react';

interface MultipleImageUploadProps {
  onImagesChanged: (files: File[]) => void;
  currentImages?: File[];
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  onImagesChanged,
  currentImages = [],
  maxImages = 10,
  disabled = false,
  className = ''
}) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create preview URLs when currentImages change
  React.useEffect(() => {
    if (currentImages.length > 0) {
      const urls = currentImages.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      
      // Cleanup URLs when component unmounts or images change
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url));
      };
    } else {
      setPreviewUrls([]);
    }
  }, [currentImages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check total images limit
    const totalImages = currentImages.length + files.length;
    if (totalImages > maxImages) {
      setUploadError(`Số lượng ảnh không được vượt quá ${maxImages}`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Tất cả file phải là định dạng ảnh (JPG, PNG, GIF, WebP)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Kích thước mỗi file không được vượt quá 10MB');
        return;
      }

      // Skip empty files
      if (file.size === 0) {
        console.warn('Skipping empty file:', file.name);
        continue;
      }

      validFiles.push(file);
    }

    setUploadError(null);

    // Add new files to current images
    const updatedImages = [...currentImages, ...validFiles];
    onImagesChanged(updatedImages);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = currentImages.filter((_, i) => i !== index);
    onImagesChanged(updatedImages);
    setUploadError(null);
  };

  const handleClick = () => {
    if (!disabled && currentImages.length < maxImages) {
      fileInputRef.current?.click();
    }
  };

  const remainingSlots = maxImages - currentImages.length;

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || currentImages.length >= maxImages}
      />

      {/* Image Grid */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 rounded-lg shadow-md object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/150x150?text=Invalid+Image';
                }}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                  title="Xóa ảnh"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                {index + 1}/{currentImages.length}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add More Button or Initial Upload Button */}
      {remainingSlots > 0 && (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={`w-full px-4 ${
            previewUrls.length === 0 ? 'py-8' : 'py-4'
          } border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {previewUrls.length === 0 ? (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Nhấn để tải ảnh lên
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF hoặc WebP (tối đa {maxImages} ảnh, mỗi ảnh tối đa 10MB)
                </p>
              </div>
            </>
          ) : (
            <>
              <Plus className="w-6 h-6 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Thêm ảnh ({remainingSlots} còn lại)
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <ImageIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Info Message */}
      {previewUrls.length === 0 && !uploadError && (
        <p className="text-xs text-gray-500 text-center">
          Thêm hình ảnh sẽ giúp bài đăng của bạn thu hút hơn (tối đa {maxImages} ảnh)
        </p>
      )}

      {/* Image Counter */}
      {previewUrls.length > 0 && (
        <p className="text-xs text-gray-600 text-center">
          Đã chọn {currentImages.length}/{maxImages} ảnh
        </p>
      )}
    </div>
  );
};

export default MultipleImageUpload;
