/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Badge from "@/src/components/ui/badge";
import Button from "@/src/components/ui/button";
import GenericFormModal, {
  FormFieldConfig,
} from "@/src/components/ui/genericFormModal";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {useGetGreenhouseAreas} from "@/src/hooks/use-area";
import {
  useCreateDevice,
  useDeleteDevice,
  useGetGreenhouseDevice,
  useUpdateDevice,
} from "@/src/hooks/use-device";
import {useGetMyGreenhouses} from "@/src/hooks/use-greenhouses";
import {DeviceType, GreenhousesType} from "@/src/types";
import {motion} from "framer-motion";
import {Edit, Eye, Trash2} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
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
  const [selectedGreenhouseId, setSelectedGreenhouseId] = useState<string>("");

  const {
    data: greenhouses = [],
    isLoading: isLoadingGreenhouse,
    isError: isErrorGreenhouse,
    error: errorGreenhouse,
  } = useGetMyGreenhouses();

  useEffect(() => {
    if (greenhouses.data?.length > 0 && selectedGreenhouseId === "") {
      setSelectedGreenhouseId(greenhouses.data[0].id);
    }
  }, [greenhouses, selectedGreenhouseId]);

  const {
    data: areas = [],
    isLoading: isLoadingAreas,
    isError: isErrorAreas,
    error: errorAreas,
  } = useGetGreenhouseAreas(selectedGreenhouseId);

  const {
    data: devices = [],
    isLoading: isLoadingDevices,
    isError: isErrorDevices,
    error: errorDevices,
  } = useGetGreenhouseDevice(selectedGreenhouseId);

  console.log(devices);

  const createMutation = useCreateDevice();
  const updateMutation = useUpdateDevice();
  const deleteMutation = useDeleteDevice();

  if (isErrorDevices) {
    toast.error(errorDevices?.message || "Failed to fetch users");
  }

  if (isErrorAreas) {
    toast.error(errorAreas.message || "Failed to fetch greenhouses");
  }

  if (isErrorGreenhouse) {
    toast.error(errorGreenhouse.message || "Failed to fetch greenhouses");
  }

  const handleOpenAdd = () => {
    if (!selectedGreenhouseId) {
      toast.warning("Please select a greenhouse first!");
      return;
    }
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: DeviceType) => {
    if (!selectedGreenhouseId) {
      toast.warning("Please select a greenhouse first!");
      return;
    }
    setSelectedData({
      id: row.id,
      name: row.name,
      type: row.type,
      macAddress: row.macAddress,
      status: "OFFLINE",
      areaId: row.areaId,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (data: DeviceFormType) => {
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

  const areasConfig = areas.data?.map((area: any) => ({
    label: area.name,
    value: area.id,
  }));

  const DevicesField: FormFieldConfig[] = [
    {
      name: "name",
      label: "Name",
      placeholder: "e.g., Operator, Admin",
    },
    {
      name: "macAddress",
      label: "Mac Address",
      placeholder:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quae, rerum.",
    },
    {
      name: "areaId",
      label: "Area ID",
      type: "select",
      options: areasConfig,
    },
  ];

  const columns: TableColumn<DeviceType>[] = [
    {header: "Name", accessor: "name"},
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
            onClick={() =>
              router.push(`/dashboard/device/${selectedGreenhouseId}/${row.id}`)
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
            Device Management
          </h1>
          <p className="text-gray-500">Manage your greenhouse devices</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedGreenhouseId}
            onChange={(e) => setSelectedGreenhouseId(e.target.value)}
            disabled={isLoadingGreenhouse}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-green-500 shadow-sm"
          >
            {/* <option value="">Greenhouse</option> */}
            {greenhouses.data?.map((gh: GreenhousesType) => (
              <option key={gh.id} value={gh.id}>
                {gh.name}
              </option>
            ))}
          </select>
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
          data={devices}
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
