import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/apis/apis";
import { QUERY_KEYS } from "@/constants/consts";

export function useLogOutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.logOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
    },
  });
}
