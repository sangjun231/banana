"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImageUpload: (images: string[]) => void;
}

interface ImageItem {
  id: string;
  preview: string;
  base64: string;
}

export default function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const maxImages = 4;

  const handleFiles = (files: FileList) => {
    const remaining = maxImages - images.length;
    if (remaining === 0) {
      alert("최대 4장까지만 업로드 가능합니다");
      return;
    }

    const fileArray = Array.from(files).slice(0, remaining);
    const newImages: ImageItem[] = [];
    let processed = 0;

    fileArray.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1];

        newImages.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          preview: base64String,
          base64: base64Data,
        });

        processed++;
        if (processed === fileArray.length) {
          const updatedImages = [...images, ...newImages];
          setImages(updatedImages);
          onImageUpload(updatedImages.map((img) => img.base64));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = (id: string) => {
    const newImages = images.filter((img) => img.id !== id);
    setImages(newImages);
    onImageUpload(newImages.map((img) => img.base64));
  };

  return (
    <div className="space-y-4">
      {/* 업로드된 이미지 그리드 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => (
            <div key={image.id} className="relative">
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image
                  src={image.preview}
                  alt={`Uploaded ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                onClick={() => handleRemove(image.id)}
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-2 py-1 text-white text-xs">
                {index + 1}/4
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 영역 - 4장 미만일 때만 표시 */}
      {images.length < maxImages && (
        <div>
          <label
            htmlFor="image-upload"
            className={`block cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }
            `}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-3 text-gray-600 text-sm">
              이미지를 드래그하거나 클릭해서 업로드하세요
            </p>
            <p className="mt-1 text-gray-400 text-xs">
              {images.length}/4 - {maxImages - images.length}장 더 추가 가능
            </p>
            <div className="mt-3">
              <span className="inline-block rounded-md border border-input bg-background px-4 py-2 font-medium text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
                파일 선택 ({maxImages - images.length}장)
              </span>
            </div>
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="hidden"
            id="image-upload"
          />
        </div>
      )}

      {/* 안내 메시지 */}
      {images.length === 0 && (
        <p className="text-center text-gray-500 text-xs">
          💡 인생네컷처럼 4장의 사진을 업로드하면 세로로 합쳐서 생성됩니다
        </p>
      )}
    </div>
  );
}
