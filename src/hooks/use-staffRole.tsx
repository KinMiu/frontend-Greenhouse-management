import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {GreenhouseFormType, StaffRoleFormType, StaffRoleType} from "../types";
import {
  CreateStaffRole,
  DeleteStaffRole,
  GetGreenhouseStaffRoles,
  UpdateStaffRole,
} from "../services/staffRole.services";

export const useGetGreenhouseStaffRoles = (id: string) => {
  return useQuery({
    queryKey: ["staff-role", id],
    queryFn: () => GetGreenhouseStaffRoles(id),
    enabled: !!id,
  });
};

export const useCreateStaffRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idGreenhouse,
      ...data
    }: {idGreenhouse: string} & StaffRoleFormType) =>
      CreateStaffRole(idGreenhouse, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["staff-role"]});
    },
  });
};

export const useUpdateStaffRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      idGreenhouse,
      ...data
    }: {id: string; idGreenhouse: string} & StaffRoleFormType) =>
      UpdateStaffRole(id, idGreenhouse, data as StaffRoleFormType),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["staff-role"]});
    },
  });
};

export const useDeleteStaffRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, idGreenhouse}: {id: string; idGreenhouse: string}) =>
      DeleteStaffRole(id, idGreenhouse),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["staff-role"]});
    },
  });
};
