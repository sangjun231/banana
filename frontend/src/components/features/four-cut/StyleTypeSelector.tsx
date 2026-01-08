"use client";

import { Check, Frame, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StyleTypeSelectorProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

const styleTypes = [
  {
    id: "background-change",
    name: "배경 변환",
    icon: Palette,
    emoji: "🎨",
    description: "AI가 4장 모두 동일한 배경으로 완전히 변환",
    detail: "사진 배경을 통일감 있게 바꿔드려요",
  },
  {
    id: "frame-add",
    name: "프레임 추가",
    icon: Frame,
    emoji: "🖼️",
    description: "원본 유지하고 외곽에 분위기 있는 여백 추가",
    detail: "원본은 그대로, 테두리에만 감성을 더해요",
  },
];

export default function StyleTypeSelector({
  selectedType,
  onTypeSelect,
}: StyleTypeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {styleTypes.map((type) => {
        const Icon = type.icon;
        return (
          <Card
            key={type.id}
            onClick={() => onTypeSelect(type.id)}
            className={`cursor-pointer p-4 transition-all hover:shadow-md ${
              selectedType === type.id
                ? "border-2 border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                : "border hover:border-gray-400"
            }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{type.emoji}</span>
                  <h3 className="font-semibold text-gray-800">{type.name}</h3>
                </div>
                <p className="mt-1 text-gray-600 text-xs">{type.description}</p>
                <p className="mt-1 text-gray-500 text-xs">{type.detail}</p>
              </div>
              {selectedType === type.id && (
                <div className="rounded-full bg-purple-500 p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
