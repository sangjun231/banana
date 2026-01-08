"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MoodSelectorProps {
  selectedMood: string;
  onMoodSelect: (mood: string) => void;
}

const moods = [
  {
    id: "bright",
    name: "밝고 화사하게",
    emoji: "☀️",
    description: "따뜻하고 밝은 분위기",
  },
  { id: "vintage", name: "빈티지", emoji: "📷", description: "레트로한 감성" },
  {
    id: "dramatic",
    name: "드라마틱",
    emoji: "🎭",
    description: "강렬하고 극적인 분위기",
  },
  {
    id: "soft",
    name: "부드럽고 몽환적",
    emoji: "🌸",
    description: "파스텔 톤의 은은한 감성",
  },
  {
    id: "cool",
    name: "쿨톤 감성",
    emoji: "❄️",
    description: "시원하고 모던한 느낌",
  },
  {
    id: "warm",
    name: "따뜻한 감성",
    emoji: "🔥",
    description: "포근하고 따뜻한 분위기",
  },
];

export default function MoodSelector({
  selectedMood,
  onMoodSelect,
}: MoodSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {moods.map((mood) => (
        <Card
          key={mood.id}
          onClick={() => onMoodSelect(mood.id)}
          className={`cursor-pointer p-4 transition-all hover:shadow-md ${
            selectedMood === mood.id
              ? "border-2 border-blue-500 bg-blue-50 ring-2 ring-blue-200"
              : "border hover:border-gray-400"
          }
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{mood.emoji}</span>
                <h3 className="font-semibold text-gray-800">{mood.name}</h3>
              </div>
              <p className="mt-1 text-gray-600 text-xs">{mood.description}</p>
            </div>
            {selectedMood === mood.id && (
              <div className="rounded-full bg-blue-500 p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
