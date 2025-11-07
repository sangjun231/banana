import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { postUserServer } from "@/apis/server-apis";
import { QUERY_KEYS } from "@/constants/consts";
import { MemorialPhotoGenerator } from "@/features/gen/ui/memorial-photo-generator";

async function MemorialPhotoPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: () => postUserServer(),
  });

  const user = await queryClient.getQueryData([QUERY_KEYS.USER]);

  // console.log("user in MemorialPhotoPage ===========>", user);
  if (!user) return redirect("/");

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="container mx-auto py-10">
        <MemorialPhotoGenerator />
      </div>
    </HydrationBoundary>
  );
}

export default MemorialPhotoPage;
