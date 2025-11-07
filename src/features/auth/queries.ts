import { useQuery } from "@tanstack/react-query";
import api from "@/apis/apis";
import { QUERY_KEYS } from "@/constants/consts";

export function useUserQuery() {
  return useQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: api.getUser,
  });
}
