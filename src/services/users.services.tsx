import {apiFetch} from "../lib/api";
import {ActivateData, UserType} from "../types";

export const GetAllUsers = async () => {
  return apiFetch<UserType[]>("/user", {
    method: "GET",
  });
};

export const ActivateUser = async (data: ActivateData) => {
  console.log(data);
  return apiFetch(`/user/${data.id}/activate?isActive=${data.status}`, {
    method: "PATCH",
  });
};
