import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {StaffFormType, StaffRoleFormType} from "../types";
import {
  CreateStaffRole,
  DeleteStaffRole,
  UpdateStaffRole,
} from "../services/staffRole.services";
import {CreateStaff, GetGreenhouseStaff} from "../services/staff.services";

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
      queryClient.invalidateQueries({queryKey: ["greenhouses"]});
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
      queryClient.invalidateQueries({queryKey: ["greenhouses"]});
    },
  });
};

export const useDeleteStaffRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, idGreenhouse}: {id: string; idGreenhouse: string}) =>
      DeleteStaffRole(id, idGreenhouse),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["greenhouses"]});
    },
  });
};
