/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Badge from "@/src/components/ui/badge";
import Button from "@/src/components/ui/button";
import GenericFormModal, {
  FormFieldConfig,
} from "@/src/components/ui/genericFormModal";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {
  useCreateDevice,
  useDeleteDevice,
  useGetAllDevice,
  useUpdateDevice,
} from "@/src/hooks/use-device";
import {DeviceType} from "@/src/types";
import {motion} from "framer-motion";
import {Edit, Eye, Trash2} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {toast} from "sonner";
import z from "zod";

const DeviceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  macAddress: z
    .string()
    .regex(
      /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
      "Invalid MAC Address format",
    ),
  areaId: z.string().optional().nullable(),
});

type DeviceFormType = z.infer<typeof DeviceSchema>;

export default function DevicePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<
    (DeviceFormType & {id: string}) | null
  >(null);

  const {
    data: devices = [],
    isLoading: isLoadingDevices,
    isError: isErrorDevices,
    error: errorDevices,
  } = useGetAllDevice();

  console.log(devices);

  const createMutation = useCreateDevice();
  const updateMutation = useUpdateDevice();
  const deleteMutation = useDeleteDevice();

  if (isErrorDevices) {
    toast.error(errorDevices?.message || "Failed to fetch Devices");
  }

  const handleOpenAdd = () => {
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: DeviceType) => {
    setSelectedData({
      id: row.id,
      name: row.name,
      type: row.type,
      macAddress: row.macAddress,
      status: "OFFLINE",
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (data: DeviceFormType) => {
    if (selectedData) {
      console.log(selectedData);
      updateMutation.mutate(
        {id: selectedData.id, ...data},
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Device updated successfully");
            setIsModalOpen(false);
          },
          onError: (err: any) => toast.error(err.message),
        },
      );
    } else {
      createMutation.mutate(
        {
          ...data,
        },
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Device created successfully");
            setIsModalOpen(false);
          },
          onError: (err: any) => toast.error(err.message),
        },
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this device?")) {
      deleteMutation.mutate(
        {id: id},
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Device deleted successfully");
          },
          onError: (error: any) => {
            toast.error(error.message);
          },
        },
      );
    }
  };

  const DevicesField: FormFieldConfig[] = [
    {
      name: "name",
      label: "Name",
      placeholder: "e.g., ESP32 Sensor Suhu, Node Pompa 1",
    },
    {
      name: "macAddress",
      label: "Mac Address",
      placeholder: "e.g., FF:EE:DD:CC:BB:AA",
    },
  ];

  const columns: TableColumn<DeviceType>[] = [
    {header: "Name", accessor: "name"},
    {
      header: "MAC Address",
      cell: (row) => (
        <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono border border-gray-200 text-gray-700">
          {row.macAddress}
        </code>
      ),
    },
    {
      header: "Relation",
      cell: (row) => {
        const hasGreenhouse = row.greenhouse && row.greenhouse.owner;
        return (
          <>
            {!hasGreenhouse ? (
              <Badge color="red">No Relation</Badge>
            ) : (
              <Badge color="green">{row.greenhouse?.owner?.name}</Badge>
            )}
          </>
        );
      },
    },
    {
      header: "Created At",
      cell: (row) => {
        const date = new Date(row.createdAt);
        const tanggal = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        return (
          <div className="text-gray-600 text-sm">
            <p>{tanggal}</p>
          </div>
        );
      },
    },
    {
      header: "Updated At",
      cell: (row) => {
        const date = new Date(row.updatedAt);
        const tanggal = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        return (
          <div className="text-gray-600 text-sm">
            <p>{tanggal}</p>
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
            onClick={() =>
              router.push(`/dashboard/super-admin/device/${row.id}`)
            }
            variant="ghost"
            className="p-2 text-blue-600 hover:bg-blue-50"
            title="View Detail"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => handleOpenEdit(row)}
            variant="ghost"
            className="p-2 text-amber-600 hover:bg-amber-50" // Ganti warna dikit biar beda sama icon Eye
            title="Edit Device"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => handleDelete(row.id)}
            variant="ghost"
            className="p-2 text-red-600 hover:bg-red-50"
            title="Delete Device"
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
            Device Management
          </h1>
          <p className="text-gray-500">Manage your greenhouse devices</p>
        </div>

        {/* Tombol ADD ditekuk untuk membuka Modal, bukan pindah halaman */}
        <Button variant="primary" onClick={handleOpenAdd}>
          + Add New Device
        </Button>
      </div>
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.4}}
      >
        <Table
          columns={columns}
          data={devices.data || []}
          isLoading={isLoadingDevices}
          emptyMessage="No users found"
        />
      </motion.div>

      <GenericFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedData ? "Edit Device" : "Add Device"}
        schema={DeviceSchema}
        fields={DevicesField}
        defaultValues={
          selectedData
            ? {
                name: selectedData.name,
                type: selectedData.type,
                macAddress: selectedData.macAddress,
                status: selectedData.status,
                areaId: selectedData.areaId,
              }
            : {
                name: "",
                type: "SENSOR",
                macAddress: "",
                status: "OFFLINE",
                areaId: "",
              }
        }
        onSubmit={handleSubmitForm}
        isLoading={isPending}
        submitText={selectedData ? "Save Changes" : "Create"}
      />
    </div>
  );
}
