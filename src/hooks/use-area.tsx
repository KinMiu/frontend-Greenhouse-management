import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {AreaFormType} from "../types";
import {
  CreateArea,
  DeleteArea,
  GetGreenhouseAreas,
  UpdateArea,
} from "../services/area.services";

export const useGetGreenhouseAreas = (id: string) => {
  return useQuery({
    queryKey: ["areas", id],
    queryFn: () => GetGreenhouseAreas(id),
    enabled: !!id,
  });
};

export const useCreateArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idGreenhouse,
      ...data
    }: {idGreenhouse: string} & AreaFormType) => CreateArea(idGreenhouse, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["areas"]});
    },
  });
};

export const useUpdateArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      idGreenhouse,
      ...data
    }: {id: string; idGreenhouse: string} & AreaFormType) =>
      UpdateArea(id, idGreenhouse, data as AreaFormType),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["areas"]});
    },
  });
};

export const useDeleteArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, idGreenhouse}: {id: string; idGreenhouse: string}) =>
      DeleteArea(id, idGreenhouse),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["areas"]});
    },
  });
};
