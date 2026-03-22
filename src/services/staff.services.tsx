import {apiFetch} from "../lib/api";
import {StaffFormType, StaffRoleFormType, UserType} from "../types";

export const GetGreenhouseStaff = async (id: string) => {
  return apiFetch<UserType[]>(`/staff/${id}/my-staff`, {
    method: "GET",
  });
};

export const CreateStaff = async (
  idGreenhouse: string,
  data: StaffFormType,
) => {
  return apiFetch(`/auth/${idGreenhouse}/register-staff`, {
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
