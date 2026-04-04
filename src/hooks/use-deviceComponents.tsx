import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {
  DeviceComponentsFormType,
  DeviceFromType,
  ToggleActuatorFormType,
} from "../types";
import {
  CreateDevice,
  DeleteDevice,
  GetGreenhouseDevice,
  GetGreenhouseDeviceDetails,
  UpdateDevice,
} from "../services/device.services";
import {
  CreateDeviceComponents,
  DeleteDeviceComponents,
  GetGreenhouseDeviceComponents,
  GetGreenhouseDeviceComponentsDetails,
  toggleActuator,
  UpdateDeviceComponents,
} from "../services/deviceComponents.services";

export const useGetGreenhouseDeviceComponents = (id: string) => {
  return useQuery({
    queryKey: ["devices", id],
    queryFn: () => GetGreenhouseDeviceComponents(id),
    enabled: !!id,
  });
};

export const useGetGreenhouseDeviceComponentsDetails = (deviceId: string) => {
  console.log("dari hooks", deviceId);
  return useQuery({
    queryKey: ["device", deviceId],
    queryFn: () => GetGreenhouseDeviceComponentsDetails(deviceId),
    // enabled: !!deviceId,
  });
};

export const useCreateDeviceComponents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idDevice,
      idGreenhouse,
      ...data
    }: {idDevice: string; idGreenhouse: string} & DeviceComponentsFormType) =>
      CreateDeviceComponents(
        idDevice,
        idGreenhouse,
        data as DeviceComponentsFormType,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["devices"]});
    },
  });
};

export const useUpdateDeviceComponents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      componentId,
      deviceId,
      idGreenhouse,
      ...data
    }: {
      componentId: string;
      deviceId: string;
      idGreenhouse: string;
    } & DeviceComponentsFormType) =>
      UpdateDeviceComponents(
        componentId,
        deviceId,
        idGreenhouse,
        data as DeviceComponentsFormType,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["devices"]});
    },
  });
};

export const useDeleteDeviceComponents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      componentId,
      deviceId,
      idGreenhouse,
    }: {
      componentId: string;
      deviceId: string;
      idGreenhouse: string;
    }) => DeleteDeviceComponents(componentId, deviceId, idGreenhouse),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["devices"]});
    },
  });
};

export const useToggleActuator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      componentId,
      ...data
    }: {deviceId: string; componentId: string} & ToggleActuatorFormType) =>
      toggleActuator(componentId, deviceId, data as ToggleActuatorFormType),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["devices"]});
    },
  });
};
