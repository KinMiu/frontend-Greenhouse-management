/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Badge from "@/src/components/ui/badge";
import Button from "@/src/components/ui/button";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {useActivateUser, useAllUsers} from "@/src/hooks/use-users";
import {ActivateData, UserType} from "@/src/types";
import {motion} from "framer-motion";
import {Edit, ToggleLeft, ToggleRight, Trash2} from "lucide-react";
import {toast} from "sonner";

export default function UsersPage() {
  const ActivateUserMutation = useActivateUser();
  const {data: users = [], isLoading, isError, error} = useAllUsers();

  const handleActivateUser = async (id: string, status: boolean) => {
    const data: ActivateData = {
      id: id,
      status,
    };
    ActivateUserMutation.mutate(data, {
      onSuccess: (res: any) => {
        console.log(res);
        toast.success(res.message || "User activated successfully");
      },
      onError: (error: any) => {
        toast.error(error.message);
      },
    });
  };

  if (isError) {
    toast.error(error.message || "Failed to fetch users");
  }

  const columns: TableColumn<UserType>[] = [
    {header: "Name", accessor: "name"},
    // {header: "Email", accessor: "email"},
    {header: "Role", accessor: "role"},
    {
      header: "Status",
      cell: (user) => {
        // console.log(user);
        return (
          <Badge color={`${user.isActive === true ? "green" : "red"}`}>
            {user.isActive === true ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      header: "Action",
      className: "text-right",
      cell: (user) => (
        <div className="flex items-center justify-end gap-2">
          {user.isActive === true ? (
            <Button
              onClick={() => handleActivateUser(user.id, false)}
              variant="ghost"
              className="p-2 text-blue-600 hover:bg-blue-50"
            >
              <ToggleRight className="w-4 h-4 text-green-600" />
            </Button>
          ) : (
            <Button
              onClick={() => handleActivateUser(user.id, true)}
              variant="ghost"
              className="p-2 text-blue-600 hover:bg-blue-50"
            >
              <ToggleLeft className="w-4 h-4 text-gray-600" />
            </Button>
          )}

          <Button
            variant="ghost"
            className="p-2 text-blue-600 hover:bg-blue-50"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" className="p-2 text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
          <p>Manage your greenhouse platform users</p>
        </div>
        <Button variant="primary">+ Add New User</Button>
      </div>
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.4}}
      >
        <Table
          columns={columns}
          data={users.data}
          isLoading={isLoading}
          emptyMessage="No users found"
        />
      </motion.div>
    </div>
  );
}
