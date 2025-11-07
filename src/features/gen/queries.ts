import { useQuery } from "@tanstack/react-query";
import api from "@/apis/apis";
import { QUERY_KEYS } from "@/constants/consts";

export const useGetMemorialPhotosQuery = (category: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.MEMORIAL_PHOTOS],
    queryFn: () => api.getMemorialPhotos(category),
  });
};

export const useGetMemorialPhotoQuery = (id: string, category: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.MEMORIAL_PHOTOS, id, category],
    queryFn: () => api.getMemorialPhoto(id, category),
  });
};
