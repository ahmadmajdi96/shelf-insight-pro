import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ImageCaptureProps {
  onImageCapture: (file: File, base64: string) => void;
  isProcessing?: boolean;
  preview?: string | null;
  onClear?: () => void;
  processingText?: string;
  className?: string;
}

export function ImageCapture({
  onImageCapture,
  isProcessing,
  preview,
  onClear,
  processingText = 'Processing...',
  className,
}: ImageCaptureProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onImageCapture(file, base64);
    };
    reader.readAsDataURL(file);
  }, [onImageCapture]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  if (preview) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden bg-secondary", className)}>
        <img 
          src={preview} 
          alt="Preview" 
          className="w-full aspect-video object-cover"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
              <p className="text-foreground font-medium">{processingText}</p>
            </div>
          </div>
        )}
        {!isProcessing && onClear && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-3 right-3"
            onClick={onClear}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-colors cursor-pointer",
        isDragging 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={openFilePicker}
    >
      {/* Hidden file input for gallery/file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Hidden camera input - uses rear camera on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture={isMobile ? "environment" : undefined}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Upload Image
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Drag and drop an image, or click to browse. 
            Supports JPG, PNG up to 10MB.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button 
            variant="glow" 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
          <Button 
            variant="outline" 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openCamera();
            }}
          >
            <Camera className="w-4 h-4 mr-2" />
            {isMobile ? 'Open Camera' : 'Take Photo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
