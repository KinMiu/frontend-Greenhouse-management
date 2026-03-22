import {apiFetch} from "../lib/api";
import {SignInType, SignUpType, UserType} from "../types";

export const SignUp = async (data: SignUpType) => {
  return apiFetch("/auth/register-owner", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const SignIn = async (data: SignInType) => {
  return apiFetch("/auth/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const GetMe = async () => {
  return apiFetch("/auth/me", {
    method: "GET",
  });
};
