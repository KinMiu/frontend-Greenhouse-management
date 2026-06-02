import {apiFetch} from "../lib/api";
import {ConfigFormType} from "../types";

export const GetGreenhouseAreasAutomation = async (
  idGreenhouse: string,
  idArea: string,
) => {
  return apiFetch<ConfigFormType[]>(`/automations/${idGreenhouse}/${idArea}`, {
    method: "GET",
  });
};

export const CreateAutomation = async (
  idGreenhouse: string,
  data: ConfigFormType,
) => {
  return apiFetch(`/automations/${idGreenhouse}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const UpdateAutomation = async (
  id: string,
  idGreenhouse: string,
  data: ConfigFormType,
) => {
  return apiFetch(`/automations/${idGreenhouse}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const DeleteAutomation = async (id: string, idGreenhouse: string) => {
  return apiFetch(`/automations/${idGreenhouse}/${id}`, {
    method: "DELETE",
  });
};
