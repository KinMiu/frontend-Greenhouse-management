import {apiFetch} from "../lib/api";
import {StaffFormType, StaffRoleFormType, StaffType, UserType} from "../types";

export const GetGreenhouseStaff = async (id: string) => {
  return apiFetch<StaffType[]>(`/staff/${id}/my-staff`, {
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

export const UpdateStaff = async (
  id: string,
  idGreenhouse: string,
  data: StaffFormType,
) => {
  return apiFetch(`/staff/${idGreenhouse}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const DeleteStaff = async (id: string, idGreenhouse: string) => {
  return apiFetch(`/staff/${idGreenhouse}/${id}`, {
    method: "DELETE",
  });
};
