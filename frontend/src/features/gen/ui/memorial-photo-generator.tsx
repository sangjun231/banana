"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FileImage, Loader2, Upload, Wand2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GEN_CATEGORY } from "@/constants/consts";
import { useIsMobile } from "@/hooks/use-mobile";
import { base64ToFile, downloadImageMO, downloadImagePC } from "@/lib/utils";
import {
  useGenerateMemorialPhotoMutation,
  useSaveMemorialPhotoMutation,
} from "../mutations";

export function MemorialPhotoGenerator() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const queryClient = useQueryClient();
  const {
    mutate: generateMemorialPhoto,
    data,
    isPending,
    error,
  } = useGenerateMemorialPhotoMutation();
  const {
    mutate: saveMemorialPhoto,
    isPending: isSavePending,
    error: saveError,
  } = useSaveMemorialPhotoMutation(GEN_CATEGORY.MEMORIAL);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        // 4MB 사이즈 제한
        setLocalError("이미지 파일 크기는 4MB를 초과할 수 없습니다.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setLocalError(null);
      // 새 파일 선택 시 이전 결과물 초기화
      if (data) {
        // This is a bit of a hack to reset the mutation state
        queryClient.invalidateQueries({ queryKey: ["memorial-photo"] });
      }
    }
  };

  const handleGenerateClick = () => {
    if (selectedFile) {
      generateMemorialPhoto(selectedFile, {
        onSuccess: (data) => {
          toast.success("이미지 생성에 성공했습니다.");
          const file = base64ToFile(
            data.base64Image,
            "generated.webp",
            "image/webp",
          );
          saveMemorialPhoto(file);
        },
        onError: () => {
          setLocalError("이미지 저장에 실패했습니다.");
        },
      });
    }
  };

  const handleDownloadImage = async () => {
    if (!data?.base64Image) return;
    if (isMobile) {
      return await downloadImageMO(data.base64Image, "generated");
    }
    return downloadImagePC(data.base64Image, "generated");
  };

  useEffect(() => {
    if (saveError) {
      setLocalError("이미지 저장에 실패했습니다.");
    }
  }, [saveError]);

  useEffect(() => {
    console.log(
      "isSavePending in MemorialPhotoGenerator ===========>",
      isSavePending,
    );
  }, [isSavePending]);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">AI 영정 사진 변환</CardTitle>
        <CardDescription>
          증명사진이나 프로필 사진을 업로드하여 영정 사진으로 변환해보세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
          <div className="flex h-64 flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed p-4">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview"
                width={200}
                height={250}
                className="h-full w-auto object-contain"
              />
            ) : (
              <button
                className="cursor-pointer text-center text-muted-foreground"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="mx-auto h-12 w-12" />
                <p>이미지를 여기에 업로드하세요</p>
              </button>
            )}
          </div>
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 p-4">
            {isPending ? (
              <div className="relative flex flex-col items-center space-y-2">
                <Loader2 className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-4 w-4 animate-spin" />
                <Skeleton className="h-48 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : data?.base64Image ? (
              <Image
                src={data.base64Image}
                alt="Generated"
                width={200}
                height={250}
                className="h-full w-auto cursor-pointer object-contain"
                onClick={handleDownloadImage}
              />
            ) : (
              <div className="cursor-pointer text-center text-muted-foreground">
                <Wand2 className="mx-auto h-12 w-12" />
                <p>변환된 이미지가 여기에 표시됩니다</p>
              </div>
            )}
          </div>
        </div>
        {(error || localError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>오류 발생</AlertTitle>
            <AlertDescription>{error?.message || localError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          이미지 선택
        </Button>
        <Button
          onClick={handleGenerateClick}
          disabled={!selectedFile || isPending}
          className="cursor-pointer"
        >
          {isPending ? "생성 중..." : "변환하기"}
        </Button>
      </CardFooter>
    </Card>
  );
}
