import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {GetGreenhouseDeviceComponentSensor} from "../services/deviceComponentSensor.services";

export const useGetGreenhouseDeviceComponentSensor = (
  greenhouseId: string,
  componentId: string,
  page: number = 1,
) => {
  return useQuery({
    queryKey: ["componentSensors", greenhouseId, componentId, page],
    queryFn: () =>
      GetGreenhouseDeviceComponentSensor(greenhouseId, componentId, page),
    enabled: !!greenhouseId && !!componentId,
  });
};
