import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/apis/apis";
import { QUERY_KEYS } from "@/constants/consts";

export const useGenerateMemorialPhotoMutation = () => {
  return useMutation({
    mutationFn: (image: File) => api.postGenMemorialPhoto(image),
  });
};

export const useSaveMemorialPhotoMutation = (category: string) => {
  return useMutation({
    mutationFn: (image: File) => api.postSaveMemorialPhoto(image, category),
  });
};

export const useDeleteImageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_IMAGES] });
    },
  });
};
