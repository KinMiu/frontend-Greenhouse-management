import {apiFetch} from "../lib/api";
import {StaffRoleFormType, StaffRoleType} from "../types";

export const GetGreenhouseStaffRoles = async (id: string) => {
  return apiFetch<StaffRoleType[]>(`/staff-roles/${id}/my`, {
    method: "GET",
  });
};

export const CreateStaffRole = async (
  idGreenhouse: string,
  data: StaffRoleFormType,
) => {
  return apiFetch(`/staff-roles/${idGreenhouse}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const UpdateStaffRole = async (
  id: string,
  idGreenhouse: string,
  data: StaffRoleFormType,
) => {
  return apiFetch(`/staff-roles/${idGreenhouse}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const DeleteStaffRole = async (id: string, idGreenhouse: string) => {
  return apiFetch(`/staff-roles/${idGreenhouse}/${id}`, {
    method: "DELETE",
  });
};
