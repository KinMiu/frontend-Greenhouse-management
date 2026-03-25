import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {StaffFormType, StaffRoleFormType} from "../types";
import {
  CreateStaff,
  DeleteStaff,
  GetGreenhouseStaff,
  UpdateStaff,
} from "../services/staff.services";

export const useGetGreenhouseStaff = (id: string) => {
  return useQuery({
    queryKey: ["staff", id],
    queryFn: () => GetGreenhouseStaff(id),
    enabled: !!id,
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idGreenhouse,
      ...data
    }: {idGreenhouse: string} & StaffFormType) =>
      CreateStaff(idGreenhouse, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["staff"]});
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      idGreenhouse,
      ...data
    }: {id: string; idGreenhouse: string} & StaffFormType) =>
      UpdateStaff(id, idGreenhouse, data as StaffFormType),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["staff"]});
    },
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, idGreenhouse}: {id: string; idGreenhouse: string}) =>
      DeleteStaff(id, idGreenhouse),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["staff"]});
    },
  });
};
