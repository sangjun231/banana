"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDeleteImageMutation } from "@/features/gen/mutations";
import { useMyImagesQuery } from "@/features/gen/queries";
import { Portrait } from "@/types/types";

export default function MyPage() {
  const { data: images, isLoading } = useMyImagesQuery();
  const { mutate: deleteImage } = useDeleteImageMutation();

  const handleDelete = (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      deleteImage(id, {
        onSuccess: () => {
          toast.success("이미지가 삭제되었습니다.");
        },
        onError: () => {
          toast.error("삭제에 실패했습니다.");
        },
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 font-bold text-3xl">내 이미지</h1>

      {isLoading ? (
        <div>로딩 중...</div>
      ) : !images || images.length === 0 ? (
        <div>저장된 이미지가 없습니다.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {images
            .filter(
              (image: Portrait): image is Portrait & { image_url: string } =>
                !!image.image_url,
            )
            .map((image) => (
              <Card key={image.id}>
                <CardContent className="p-4">
                  <div className="relative mb-2 aspect-square">
                    <Image
                      src={image.image_url}
                      alt={image.gen_category || "이미지"}
                      fill
                      className="rounded object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      {image.gen_category}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
