import {useMutation, useQuery} from "@tanstack/react-query";
import {GetMe, SignIn, SignUp} from "../services/auth.services";

export const useSignUp = () => {
  return useMutation({
    mutationFn: SignUp,
  });
};

export const useSignIn = () => {
  return useMutation({
    mutationFn: SignIn,
  });
};

export const useGetMe = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: GetMe,
  });
};
