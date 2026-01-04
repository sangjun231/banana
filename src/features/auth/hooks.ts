import { useEffect } from "react";
import { useLogOutMutation } from "./mutations";
import { useUserQuery } from "./queries";

function useAuth() {
  const { data: user, isPending, error } = useUserQuery();
  const { mutate: logOutMutate } = useLogOutMutation();

  const logOut = (): void => {
    logOutMutate();
  };

  // useEffect for debugging
  useEffect(() => {
    console.log("user in useAuth ===========>", user);
  }, [user]);

  useEffect(() => {
    console.log("isPending in useAuth ===========>", isPending);
  }, [isPending]);

  // useEffect(() => {
  //   if (error) {
  //     console.error("error in useAuth ===========>", error);
  //   }
  // }, [error]);

  return { user, logOut };
}

export default useAuth;
