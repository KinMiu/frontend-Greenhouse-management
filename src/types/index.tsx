export type SignUpType = {
  name: string;
  email: string;
  password: string;
  greenhouseName: string;
  location: string;
};

export type SignInType = {
  email: string;
  password: string;
};

export type UserType = {
  id: string;
  name: string;
  email: string;
  role: "SUPERADMIN" | "OWNER" | "STAFF";
  isActive: boolean;
};

export type GreenhousesType = {
  id: string;
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GreenhouseFormType = {
  name: string;
  location: string;
};

export type ActivateData = {
  id: string;
  status: boolean;
};

export type StaffRoleType = {
  id: string;
  idGreenhouse: string;
  name: string;
  description?: string | undefined;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type StaffRoleFormType = {
  name: string;
  description?: string | undefined;
  permissions: string[];
};

export type StaffFormType = {
  name: string;
  email: string;
  password: string;
};
