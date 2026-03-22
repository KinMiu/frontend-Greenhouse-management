import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
  CreateGreenhouse,
  DeleteGreenhouse,
  GetMyGreenhouse,
  UpdateGreenhouse,
} from "../services/greenhouses.services";
import {GreenhouseFormType} from "../types";

export const useGetMyGreenhouses = () => {
  return useQuery({
    queryKey: ["greenhouses"],
    queryFn: GetMyGreenhouse,
  });
};

export const useCreateGreenhouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CreateGreenhouse,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["greenhouses"]});
    },
  });
};

export const useUpdateGreenhouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, ...data}: {id: string} & GreenhouseFormType) =>
      UpdateGreenhouse(id, data as GreenhouseFormType),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["greenhouses"]});
    },
  });
};

export const useDeleteGreenhouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DeleteGreenhouse,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["greenhouses"]});
    },
  });
};
