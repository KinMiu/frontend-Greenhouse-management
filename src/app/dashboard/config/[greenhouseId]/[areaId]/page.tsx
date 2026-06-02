/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Badge from "@/src/components/ui/badge";
import Button from "@/src/components/ui/button";
import GenericFormModal, {
  FormFieldConfig,
} from "@/src/components/ui/genericFormModal";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {useGetAreaDetails} from "@/src/hooks/use-area";
import {
  useCreateAutomation,
  useDeleteAutomation,
  useGetGreenhouseAreasAutomation,
  useUpdateAutomation,
} from "@/src/hooks/use-automation";
import {AreaType, DeviceType} from "@/src/types";
import {motion} from "framer-motion";
import {Edit, Eye, Trash2} from "lucide-react";
import {useParams, useRouter} from "next/navigation";
import {useMemo, useState} from "react";
import {toast} from "sonner";
import z from "zod";

const ConfigSchema = z.object({
  deviceId: z.string().uuid("Invalid device ID format"),
  componentId: z.string().uuid("Invalid component ID format"),
  action: z.string().min(1, "Action is required").trim(),
  time: z.string().min(1, "Time is required").trim(),
  duration: z.coerce
    .number()
    .int()
    .nonnegative("Duration must be a positive number"),
});

type ConfigFormType = z.infer<typeof ConfigSchema>;

export default function StaffRolePage() {
  const router = useRouter();
  const params = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeviceIdInForm, setSelectedDeviceIdInForm] =
    useState<string>("");
  const [selectedData, setSelectedData] = useState<
    (ConfigFormType & {id: string}) | null
  >(null);

  const areaId = params.areaId as string;
  const greenhouseId = params.greenhouseId as string;

  const {data: area_detail} = useGetAreaDetails(areaId);
  // console.log(area_detail);

  const createMutation = useCreateAutomation();
  const updateMutation = useUpdateAutomation();
  const deleteMutation = useDeleteAutomation();

  const {
    data: automationConfig = [],
    isLoading: isLoadingConfig,
    isError,
  } = useGetGreenhouseAreasAutomation(greenhouseId, areaId);

  if (isError) {
    toast.error(isError?.message || "Failed to fetch areas");
  }

  const handleOpenAdd = () => {
    if (!greenhouseId) {
      toast.warning("Please select a greenhouse first!");
      return;
    }
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: any) => {
    if (!greenhouseId) {
      toast.warning("Please select a greenhouse first!");
      return;
    }

    setSelectedData({
      id: row.id,
      deviceId: row.deviceId || "",
      componentId: row.componentId || "",
      action: row.action || "ON",
      time: row.time || "00:00",
      duration: row.duration || 0,
    });
    if (row.deviceId) {
      setSelectedDeviceIdInForm(row.deviceId);
    }

    setIsModalOpen(true);
  };

  const handleSubmitForm = (data: AreaFormType) => {
    if (selectedData) {
      console.log(selectedData);
      updateMutation.mutate(
        {id: selectedData.id, idGreenhouse: params.greenhouseId, ...data},
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
          idGreenhouse: params.greenhouseId,
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
    if (confirm("Are you sure you want to delete this configuration?")) {
      deleteMutation.mutate(
        {id: id, idGreenhouse: params.greenhouseId},
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Configuration deleted successfully");
          },
          onError: (error: any) => {
            toast.error(error.message);
          },
        },
      );
    }
  };

  const columns: TableColumn<DeviceType>[] = [
    {
      header: "Device",
      cell: (row) => (
        <span className="text-[10px] text-gray-400 font-bold uppercase">
          {row.device.name || "-"}
        </span>
      ),
    },
    {
      header: "Component",
      cell: (row) => (
        <span className="text-[10px] text-gray-400 font-bold uppercase">
          {row.component.name || "-"}
        </span>
      ),
    },
    {header: "Time", accessor: "time"},
    {header: "Duration", accessor: "duration"},
    {
      header: "Status",
      cell: (row) => {
        const actionConfig = row.action;
        return (
          <>
            {actionConfig === "OFF" ? (
              <Badge color="red">{actionConfig}</Badge>
            ) : (
              <Badge color="green">{actionConfig}</Badge>
            )}
          </>
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
              router.push(`/dashboard/device/${greenhouseId}/${row.id}`)
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

  const getAreaActuator = useMemo(() => {
    console.log(area_detail);
    return (
      area_detail?.data?.devices?.filter(
        (d: any) =>
          !d.components?.some((c: any) => c.type === "SENSOR") &&
          d.components?.some((c: any) => c.type === "ACTUATOR"),
      ) || []
    );
  }, [area_detail, areaId]);
  console.log("area", getAreaActuator);

  const deviceConfig = useMemo(() =>
    getAreaActuator.map((device: any) => ({
      label: device.name,
      value: device.id,
    })),
  );

  const componentsConfig = useMemo(() => {
    const activeDevice = getAreaActuator.find(
      (d: any) => d.id === selectedDeviceIdInForm,
    );
    return activeDevice?.components?.map((component: any) => ({
      label: component.name,
      value: component.id,
    }));
  });

  const ConfigField: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "deviceId",
        label: "Device",
        type: "select",
        placeholder: "Pilih Device...",
        options: deviceConfig,
        // Kita tetap butuh ini supaya list component di bawahnya terupdate
        onChange: (e: any) => setSelectedDeviceIdInForm(e.target.value),
      },
      {
        name: "componentId",
        label: "Component",
        type: "select",
        placeholder: selectedDeviceIdInForm
          ? "Pilih Komponen..."
          : "Pilih device dulu",
        options: componentsConfig,
        disabled: !selectedDeviceIdInForm,
      },
      {
        name: "action",
        label: "Action",
        type: "select", // Biasanya automation action itu pilihan (ON / OFF / TOGGLE)
        placeholder: "Pilih aksi...",
        options: [
          {label: "Turn On", value: "ON"},
          {label: "Turn Off", value: "OFF"},
        ],
      },
      {
        name: "time",
        label: "Execution Time",
        type: "time", // Menggunakan input type="time" HTML asli
        placeholder: "Pilih waktu...",
      },
      {
        name: "duration",
        label: "Duration (Minutes)",
        type: "number",
        placeholder: "Contoh: 10",
        onChange: (e: any) => {
          const val = parseInt(e.target.value, 10);
          return isNaN(val) ? 0 : val;
        },
      },
    ],
    [deviceConfig, componentsConfig, selectedDeviceIdInForm],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {/* Teks diperbaiki */}
          <h1 className="text-2xl font-bold text-gray-800">
            Config Management
          </h1>
          <p className="text-gray-500">
            Manage your configuration on Area {area_detail?.data.name}
          </p>
        </div>

        {/* Tombol ADD ditekuk untuk membuka Modal, bukan pindah halaman */}
        <Button variant="primary" onClick={handleOpenAdd}>
          + Add New Config
        </Button>
      </div>
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.4}}
      >
        <Table
          columns={columns}
          data={automationConfig?.data || []}
          isLoading={isLoadingConfig}
          emptyMessage="No users found"
        />
      </motion.div>

      <GenericFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedData ? "Edit Configuration" : "Add Configuration"}
        schema={ConfigSchema}
        fields={ConfigField}
        defaultValues={
          selectedData
            ? {
                deviceId: selectedData.deviceId,
                componentId: selectedData.componentId,
                action: selectedData.action,
                time: selectedData.time,
                duration: selectedData.duration,
              }
            : {
                deviceId: "",
                componentId: "",
                action: "",
                time: "",
                duration: 0,
              }
        }
        onSubmit={handleSubmitForm}
        isLoading={isPending}
        submitText={selectedData ? "Save Changes" : "Create"}
      />
    </div>
  );
}
