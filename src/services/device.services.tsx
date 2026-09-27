import {apiFetch} from "../lib/api";
import {DeviceFromType, DeviceType} from "../types";

export const GetDevice = async () => {
  return apiFetch<DeviceType[]>(`/device`, {
    method: "GET",
  });
};

export const GetGreenhouseDeviceByGreenhouse = async (id: string) => {
  return apiFetch<DeviceType[]>(`/device/${id}/my`, {
    method: "GET",
  });
};

export const GetGreenhouseDeviceDetails = async (deviceId: string) => {
  console.log("dari service", deviceId);
  return apiFetch<DeviceType[]>(`/device/${deviceId}`, {
    method: "GET",
  });
};

export const CreateDevice = async (data: DeviceFromType) => {
  return apiFetch(`/device`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const UpdateDevice = async (
  id: string,
  idGreenhouse?: string,
  data?: DeviceFromType,
) => {
  const url = idGreenhouse ? `/device/${idGreenhouse}/${id}` : `/device/${id}`;
  return apiFetch(url, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const DeleteDevice = async (id: string, idGreenhouse?: string) => {
  const url = idGreenhouse ? `/device/${idGreenhouse}/${id}` : `/device/${id}`;
  return apiFetch(url, {
    method: "DELETE",
  });
};
