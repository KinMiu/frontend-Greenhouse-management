/* eslint-disable @typescript-eslint/no-explicit-any */
export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

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
  role: "SUPER_ADMIN" | "OWNER" | "STAFF";
  isActive: boolean;
  data?: any;
};

export type GreenhousesType = {
  id: string;
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: any;
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
  password?: string;
  staffRoleId?: string;
};

export type StaffType = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: string;
  createdAt: string;
  staffRoleId: string;
  staffRoles: string;
};

export type DeviceType = {
  id: string;
  name: string;
  macAddress: string;
  areaId?: string | null;
  type?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  greenhouse?: any;
  components?: any[];
  device?: any;
  component?: any;
  action?: string;
  time?: string;
  duration?: string | number;
  data?: any;
};

export type DeviceFromType = {
  name: string;
  macAddress: string;
  areaId?: string | null;
  idGreenhouse?: string;
  type?: string;
  status?: string;
};

export type AreaType = {
  id: string;
  idGreenhouse: string;
  name: string;
  description?: string | undefined;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  devices?: any[];
};

export type AreaFormType = {
  name: string;
  description?: string | undefined;
};

export type ConfigFormType = {
  deviceId: string;
  componentId: string;
  action: string;
  time: string;
  duration: string | number;
};

export type DeviceComponentsType = {
  id: string;
  name: string;
  type: "SENSOR" | "ACTUATOR" | "CAMERA";
  category?: string | null;
  unit?: string | null;
  pin?: string | null;
  createdAt?: Date;
  data?: any;
};

export type DeviceComponentsFormType = {
  name: string;
  type: "SENSOR" | "ACTUATOR" | "CAMERA";
  category?: string | null | undefined;
  unit?: string | null | undefined;
  pin?: string | null | undefined;
};

export type ToggleActuatorFormType = {
  name?: boolean;
  command?: boolean | string;
};
