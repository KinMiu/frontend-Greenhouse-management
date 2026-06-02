import {apiFetch} from "../lib/api";
import {AreaFormType, AreaType} from "../types";

export const GetGreenhouseAreas = async (id: string) => {
  return apiFetch<AreaType[]>(`/areas/${id}/my`, {
    method: "GET",
  });
};

export const GetAreaDetails = async (id: string) => {
  console.log("dari service", id);
  return apiFetch<AreaType[]>(`/areas/${id}`, {
    method: "GET",
  });
};

export const CreateArea = async (idGreenhouse: string, data: AreaFormType) => {
  return apiFetch(`/areas/${idGreenhouse}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const UpdateArea = async (
  id: string,
  idGreenhouse: string,
  data: AreaFormType,
) => {
  return apiFetch(`/areas/${idGreenhouse}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const DeleteArea = async (id: string, idGreenhouse: string) => {
  return apiFetch(`/areas/${idGreenhouse}/${id}`, {
    method: "DELETE",
  });
};
