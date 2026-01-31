import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
  isProcessing?: boolean;
}

export function ImageUploader({ onImageSelect, isProcessing }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      onImageSelect(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

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

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-secondary">
        <img 
          src={preview} 
          alt="Shelf preview" 
          className="w-full aspect-video object-cover"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
              <p className="text-foreground font-medium">Analyzing shelf...</p>
              <p className="text-sm text-muted-foreground">Detecting products and counting facings</p>
            </div>
          </div>
        )}
        {!isProcessing && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-3 right-3"
            onClick={clearImage}
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
          : "border-border hover:border-primary/50"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Upload Shelf Image
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Drag and drop an image of your retail shelf, or click to browse. 
            Supports JPG, PNG up to 10MB.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button variant="glow" type="button">
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
          <Button variant="outline" type="button">
            <Camera className="w-4 h-4 mr-2" />
            Take Photo
          </Button>
        </div>
      </div>
    </div>
  );
}
