import { Suspense } from "react";
import { RtcPage } from "@/features/rtc/ui/rtc-page";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RtcPage />
    </Suspense>
  );
}
