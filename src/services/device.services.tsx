import {apiFetch} from "../lib/api";
import {DeviceFromType, DeviceType} from "../types";

export const GetGreenhouseDevice = async (id: string) => {
  return apiFetch<DeviceType[]>(`/device/${id}/my`, {
    method: "GET",
  });
};

export const CreateDevice = async (
  idGreenhouse: string,
  data: DeviceFromType,
) => {
  return apiFetch(`/device/${idGreenhouse}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const UpdateDevice = async (
  id: string,
  idGreenhouse: string,
  data: DeviceFromType,
) => {
  return apiFetch(`/device/${idGreenhouse}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const DeleteDevice = async (id: string, idGreenhouse: string) => {
  return apiFetch(`/device/${idGreenhouse}/${id}`, {
    method: "DELETE",
  });
};
