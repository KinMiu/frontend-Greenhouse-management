import {apiFetch} from "../lib/api";
import {
  DeviceComponentsFormType,
  DeviceComponentsType,
  ToggleActuatorFormType,
} from "../types";

export const GetGreenhouseDeviceComponents = async (id: string) => {
  return apiFetch<DeviceComponentsType[]>(`/device-components/${id}/my`, {
    method: "GET",
  });
};

export const GetGreenhouseDeviceComponentsDetails = async (
  deviceId: string,
) => {
  return apiFetch<DeviceComponentsType[]>(`/device-components/${deviceId}`, {
    method: "GET",
  });
};

export const CreateDeviceComponents = async (
  idDevice: string,
  idGreenhouse: string,
  data: DeviceComponentsFormType,
) => {
  return apiFetch(`/device-components/${idGreenhouse}/${idDevice}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const UpdateDeviceComponents = async (
  componentId: string,
  deviceId: string,
  idGreenhouse: string,
  data: DeviceComponentsFormType,
) => {
  return apiFetch(
    `/device-components/${idGreenhouse}/${deviceId}/${componentId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
};

export const DeleteDeviceComponents = async (
  componentId: string,
  deviceId: string,
  idGreenhouse: string,
) => {
  return apiFetch(
    `/device-components/${idGreenhouse}/${deviceId}/${componentId}`,
    {
      method: "DELETE",
    },
  );
};

export const toggleActuator = async (
  componentId: string,
  deviceId: string,
  data: ToggleActuatorFormType,
) => {
  return apiFetch(`/device-components/${deviceId}/${componentId}/toggle`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};
