export const PERMISSIONS = {
  // GREENHOUSE_CREATE: "greenhouse.create",
  // GREENHOUSE_READ: "greenhouse.read",
  // GREENHOUSE_UPDATE: "greenhouse.update",
  // GREENHOUSE_DELETE: "greenhouse.delete",

  ZONE_CREATE: "zone.create",
  ZONE_READ: "zone.read",
  ZONE_UPDATE: "zone.update",
  ZONE_DELETE: "zone.delete",

  DEVICE_CREATE: "device.create",
  DEVICE_READ: "device.read",
  DEVICE_UPDATE: "device.update",
  DEVICE_DELETE: "device.delete",

  SENSOR_READ: "sensor.read",

  ACTUATOR_READ: "actuator.read",
  ACTUATOR_CONTROL: "actuator.control",

  PLANT_CREATE: "plant.create",
  PLANT_READ: "plant.read",
  PLANT_UPDATE: "plant.update",
  PLANT_DELETE: "plant.delete",

  HARVEST_CREATE: "harvest.create",
  HARVEST_READ: "harvest.read",
  HARVEST_UPDATE: "harvest.update",
  HARVEST_DELETE: "harvest.delete",

  STAFF_CREATE: "staff.create",
  STAFF_READ: "staff.read",
  STAFF_UPDATE: "staff.update",
  STAFF_DELETE: "staff.delete",

  ROLE_CREATE: "role.create",
  ROLE_READ: "role.read",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",

  USER_CREATE: "user.create",
  USER_READ: "user.read",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
