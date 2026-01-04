import { useMutation } from "@tanstack/react-query";
import api from "@/apis/apis";

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
