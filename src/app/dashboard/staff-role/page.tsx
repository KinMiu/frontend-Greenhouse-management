/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Button from "@/src/components/ui/button";
import GenericFormModal, {
  FormFieldConfig,
} from "@/src/components/ui/genericFormModal";
import Input from "@/src/components/ui/input";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {ALL_PERMISSIONS} from "@/src/data/permissions";
import {useGetMyGreenhouses} from "@/src/hooks/use-greenhouses";
import {
  useCreateStaffRole,
  useDeleteStaffRole,
  useGetGreenhouseStaffRoles,
  useUpdateStaffRole,
} from "@/src/hooks/use-staffRole";
import {GreenhousesType, StaffRoleType} from "@/src/types";
import {motion} from "framer-motion";
import {Edit, Trash2} from "lucide-react";
import {useEffect, useState} from "react";
import {toast} from "sonner";
import z from "zod";

const StaffRoleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  description: z.string().optional(),
  permissions: z
    .array(z.string())
    .refine((perms) => perms.every((p) => ALL_PERMISSIONS.includes(p)), {
      message: "Invalid permissions detected",
    }),
});

type StaffRoleFormType = z.infer<typeof StaffRoleSchema>;

const permissionsOptions = ALL_PERMISSIONS.map((perm) => ({
  label: perm,
  value: perm,
}));

const StaffRoleField: FormFieldConfig[] = [
  {
    name: "name",
    label: "Greenhouse Name",
    placeholder: "e.g., Operator, Admin",
  },
  {
    name: "description",
    label: "Description",
    placeholder:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quae, rerum.",
  },
  {
    name: "permissions",
    label: "Permissions",
    type: "checkbox-group",
    options: permissionsOptions,
  },
];

export default function StaffRolePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<
    (StaffRoleFormType & {id: string}) | null
  >(null);
  const [selectedGreenhouseId, setSelectedGreenhouseId] = useState<string>("");

  const {
    data: greenhouses = [],
    isLoading: isLoadingGreenhouse,
    isError: isErrorGreenhouse,
    error: errorGreenhouse,
  } = useGetMyGreenhouses();

  console.log(greenhouses.data?.length);

  useEffect(() => {
    if (greenhouses.data?.length > 0 && selectedGreenhouseId === "") {
      setSelectedGreenhouseId(greenhouses.data[0].id);
    }
  }, [greenhouses, selectedGreenhouseId]);

  const {
    data: staffRoles = [],
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
    error: errorRoles,
  } = useGetGreenhouseStaffRoles(selectedGreenhouseId);

  const createMutation = useCreateStaffRole();
  const updateMutation = useUpdateStaffRole();
  const deleteMutation = useDeleteStaffRole();

  if (isErrorRoles) {
    toast.error(errorGreenhouse?.message || "Failed to fetch users");
  }

  if (isErrorGreenhouse) {
    toast.error(errorGreenhouse.message || "Failed to fetch greenhouses");
  }

  const filteredStaffRoles =
    selectedGreenhouseId === "add"
      ? staffRoles
      : staffRoles.data?.filter(
          (role: any) => role.idGreenhouse === selectedGreenhouseId,
        );

  const handleOpenAdd = () => {
    if (!selectedGreenhouseId) {
      toast.warning("Please select a greenhouse first!");
      return;
    }
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: StaffRoleType) => {
    if (!selectedGreenhouseId) {
      toast.warning("Please select a greenhouse first!");
      return;
    }
    setSelectedData({
      id: row.id,
      name: row.name,
      idGreenhouse: row.idGreenhouse,
      description: row.description,
      permissions: row.permissions,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (data: StaffRoleFormType) => {
    if (selectedData) {
      console.log(selectedData);
      updateMutation.mutate(
        {id: selectedData.id, idGreenhouse: selectedGreenhouseId, ...data},
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Greenhouse updated successfully");
            setIsModalOpen(false);
          },
          onError: (err: any) => toast.error(err.message),
        },
      );
    } else {
      createMutation.mutate(
        {
          idGreenhouse: selectedGreenhouseId,
          ...data,
        },
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Greenhouse created successfully");
            setIsModalOpen(false);
          },
          onError: (err: any) => toast.error(err.message),
        },
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this greenhouse?")) {
      deleteMutation.mutate(
        {id: id, idGreenhouse: selectedGreenhouseId},
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Greenhouse deleted successfully");
          },
          onError: (error: any) => {
            toast.error(error.message);
          },
        },
      );
    }
  };

  const columns: TableColumn<StaffRoleType>[] = [
    {header: "Name", accessor: "name"},
    // {header: "Email", accessor: "email"},
    {header: "Description", accessor: "description"},
    {
      header: "Created At",
      cell: (row) => {
        // console.log(user);
        const date = new Date(row.createdAt);
        const tanggal = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // const jam = date.toLocaleTimeString("id-ID", {
        //   hour: "2-digit",
        //   minute: "2-digit",
        //   second: "2-digit",
        // });
        return (
          <div className="flex flex-row gap-2">
            <p>{tanggal}</p>
            {/* <p>{jam}</p> */}
          </div>
        );
      },
    },
    {
      header: "Updated At",
      cell: (row) => {
        // console.log(user);
        const date = new Date(row.updatedAt);
        const tanggal = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // const jam = date.toLocaleTimeString("id-ID", {
        //   hour: "2-digit",
        //   minute: "2-digit",
        //   second: "2-digit",
        // });
        return (
          <div className="flex flex-row gap-2">
            <p>{tanggal}</p>
            {/* <p>{jam}</p> */}
          </div>
        );
      },
    },
    {
      header: "Action",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => handleOpenEdit(row)}
            variant="ghost"
            className="p-2 text-blue-600 hover:bg-blue-50"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => handleDelete(row.id)}
            variant="ghost"
            className="p-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {/* Teks diperbaiki */}
          <h1 className="text-2xl font-bold text-gray-800">
            Staff Role Management
          </h1>
          <p className="text-gray-500">Manage your greenhouse staff role</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedGreenhouseId}
            onChange={(e) => setSelectedGreenhouseId(e.target.value)}
            disabled={isLoadingGreenhouse}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-green-500 shadow-sm"
          >
            <option value="">Greenhouse</option>
            {greenhouses.data?.map((gh: GreenhousesType) => (
              <option key={gh.id} value={gh.id}>
                {gh.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tombol ADD ditekuk untuk membuka Modal, bukan pindah halaman */}
        <Button variant="primary" onClick={handleOpenAdd}>
          + Add New Staff Role
        </Button>
      </div>
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.4}}
      >
        <Table
          columns={columns}
          data={staffRoles}
          isLoading={isLoadingRoles}
          emptyMessage="No users found"
        />
      </motion.div>

      <GenericFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedData ? "Edit Greenhouse" : "Add Greenhouse"}
        schema={StaffRoleSchema}
        fields={StaffRoleField}
        defaultValues={
          selectedData
            ? {
                name: selectedData.name,
                description: selectedData.description,
                permissions: selectedData.permissions,
              }
            : {name: "", description: "", permissions: []}
        }
        onSubmit={handleSubmitForm}
        isLoading={isPending}
        submitText={selectedData ? "Save Changes" : "Create"}
      />
    </div>
  );
}
