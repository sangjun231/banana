"use client";

import { ArrowLeft, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ImageUpload from "@/components/features/four-cut/ImageUpload";
import MoodSelector from "@/components/features/four-cut/MoodSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FourCutPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!uploadedImage || !selectedMood) {
      alert("이미지와 분위기를 선택해주세요");
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch("/api/portrait/four-cut", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: uploadedImage,
          mood: selectedMood,
        }),
      });

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error("Error generating portrait:", error);
      alert("포트레이트 생성 중 오류가 발생했습니다");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-3xl text-gray-800">
                인생네컷 AI 📸
              </h1>
              <p className="text-gray-600">
                AI로 나만의 인생네컷을 만들어보세요
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Upload & Settings */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  이미지 업로드
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload onImageUpload={setUploadedImage} />
              </CardContent>
            </Card>

            {/* Mood Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  분위기 선택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MoodSelector
                  selectedMood={selectedMood}
                  onMoodSelect={setSelectedMood}
                />
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!uploadedImage || !selectedMood || generating}
              className="w-full"
              size="lg"
            >
              {generating ? "생성 중..." : "인생네컷 생성하기"}
            </Button>
          </div>

          {/* Right: Preview/Result */}
          <Card className="lg:sticky lg:top-8 lg:h-fit">
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                    {/* 결과 이미지 표시 */}
                    <div className="flex h-full items-center justify-center">
                      <p className="text-gray-500 text-sm">{result}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      다운로드
                    </Button>
                    <Button className="flex-1">공유하기</Button>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center rounded-lg border-2 border-gray-300 border-dashed bg-gray-50">
                  <div className="text-center">
                    <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-500 text-sm">
                      이미지를 업로드하고 분위기를 선택하면
                      <br />
                      여기에 결과가 표시됩니다
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
