import {apiFetch} from "../lib/api";
import {GreenhouseFormType, GreenhousesType} from "../types";

export const GetMyGreenhouse = async () => {
  return apiFetch<GreenhousesType>("/greenhouses/my", {
    method: "GET",
  });
};

export const CreateGreenhouse = async (data: GreenhouseFormType) => {
  return apiFetch("/greenhouses", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const UpdateGreenhouse = async (
  id: string,
  data: GreenhouseFormType,
) => {
  return apiFetch(`/greenhouses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const DeleteGreenhouse = async (id: string) => {
  return apiFetch(`/greenhouses/${id}`, {
    method: "DELETE",
  });
};
