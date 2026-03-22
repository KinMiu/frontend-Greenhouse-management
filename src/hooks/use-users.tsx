import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ActivateUser, GetAllUsers} from "../services/users.services";

export const useAllUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: GetAllUsers,
  });
};

export const useActivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ActivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["users"]});
    },
  });
};
