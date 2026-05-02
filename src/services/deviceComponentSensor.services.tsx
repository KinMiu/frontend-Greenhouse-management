import {apiFetch} from "../lib/api";

export const GetGreenhouseDeviceComponentSensor = async (
  greenhouseId: string,
  componentId: string,
  page: number = 1,
  limit: number = 5,
) => {
  return apiFetch(
    `/device-component-sensor/${greenhouseId}/${componentId}?page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );
};
