import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {DeviceFromType} from "../types";
import {
  CreateDevice,
  DeleteDevice,
  GetGreenhouseDevice,
  UpdateDevice,
} from "../services/device.services";

export const useGetGreenhouseDevice = (id: string) => {
  return useQuery({
    queryKey: ["devices", id],
    queryFn: () => GetGreenhouseDevice(id),
    enabled: !!id,
  });
};

export const useCreateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idGreenhouse,
      ...data
    }: {idGreenhouse: string} & DeviceFromType) =>
      CreateDevice(idGreenhouse, data as DeviceFromType),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["devices"]});
    },
  });
};

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      idGreenhouse,
      ...data
    }: {id: string; idGreenhouse: string} & DeviceFromType) =>
      UpdateDevice(id, idGreenhouse, data as DeviceFromType),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["devices"]});
    },
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, idGreenhouse}: {id: string; idGreenhouse: string}) =>
      DeleteDevice(id, idGreenhouse),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["devices"]});
    },
  });
};
