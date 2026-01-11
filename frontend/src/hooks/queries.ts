import { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import api from "@/apis/apis";
import { QUERY_KEYS } from "@/constants/consts";

export const useUserQuery = () => {
  return useQuery<User, Error>({
    queryKey: [QUERY_KEYS.USER],
    queryFn: () => api.getUser(),
  });
};
