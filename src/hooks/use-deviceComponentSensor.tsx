import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {GetGreenhouseDeviceComponentSensor} from "../services/deviceComponentSensor.services";

export const useGetGreenhouseDeviceComponentSensor = (
  greenhouseId: string,
  componentId: string,
  page: number = 1,
  limit: number = 20,
  period: string = "all",
) => {
  return useQuery({
    queryKey: [
      "componentSensors",
      greenhouseId,
      componentId,
      page,
      limit,
      period,
    ],
    queryFn: () =>
      GetGreenhouseDeviceComponentSensor(
        greenhouseId,
        componentId,
        page,
        limit,
        period,
      ),
    enabled: !!greenhouseId && !!componentId,
  });
};
