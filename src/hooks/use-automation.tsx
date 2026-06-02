import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {AreaFormType, ConfigFormType} from "../types";
import {
  CreateAutomation,
  DeleteAutomation,
  GetGreenhouseAreasAutomation,
  UpdateAutomation,
} from "../services/automation.services";

export const useGetGreenhouseAreasAutomation = (
  idGreenhouse: string,
  idArea: string,
) => {
  return useQuery({
    queryKey: ["automationConfig", idGreenhouse, idArea],
    queryFn: () => GetGreenhouseAreasAutomation(idGreenhouse, idArea),
    enabled: !!idGreenhouse && !!idArea,
  });
};

export const useCreateAutomation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idGreenhouse,
      ...data
    }: {idGreenhouse: string} & ConfigFormType) =>
      CreateAutomation(idGreenhouse, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["automationConfig"]});
    },
  });
};

export const useUpdateAutomation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      idGreenhouse,
      ...data
    }: {id: string; idGreenhouse: string} & ConfigFormType) =>
      UpdateAutomation(id, idGreenhouse, data as ConfigFormType),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["automationConfig"]});
    },
  });
};

export const useDeleteAutomation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, idGreenhouse}: {id: string; idGreenhouse: string}) =>
      DeleteAutomation(id, idGreenhouse),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["automationConfig"]});
    },
  });
};
