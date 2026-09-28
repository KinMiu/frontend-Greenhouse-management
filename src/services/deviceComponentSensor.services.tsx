import {apiFetch} from "../lib/api";

export const GetGreenhouseDeviceComponentSensor = async (
  greenhouseId: string,
  componentId: string,
  page: number = 1,
  limit: number = 20,
  period: string = "all",
) => {
  return apiFetch(
    `/device-component-sensor/${greenhouseId}/${componentId}?page=${page}&limit=${limit}&period=${period}`,
    {
      method: "GET",
    },
  );
};
