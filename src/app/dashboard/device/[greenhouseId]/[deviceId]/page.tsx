/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {useParams, useRouter} from "next/navigation";
import {Cpu, Wifi, MapPin, Activity, Trash2, Edit} from "lucide-react";
import Button from "@/src/components/ui/button";
import {useGetGreenhouseDeviceDetails} from "@/src/hooks/use-device";
import z from "zod";
import GenericFormModal, {
  FormFieldConfig,
} from "@/src/components/ui/genericFormModal";
import {toast} from "sonner";
import {useState} from "react";
import {
  useCreateDeviceComponents,
  useDeleteDeviceComponents,
  useUpdateDeviceComponents,
} from "@/src/hooks/use-deviceComponents";
import {DeviceComponentsType} from "@/src/types";

const deviceType = [
  {
    name: "Sensor",
    value: "SENSOR",
  },
  {
    name: "Actuator",
    value: "ACTUATOR",
  },
];

const DeviceComponentsSchema = z.object({
  name: z
    .string({required_error: "Name is required"})
    .min(2, "Name must be at least 2 characters")
    .trim(),
  type: z.enum(["SENSOR", "ACTUATOR"], {
    required_error: "Type is required",
    invalid_type_error: "Type must be exactly 'SENSOR' or 'ACTUATOR'",
  }),
  category: z.string().nullish(),
  unit: z.string().nullish(),
  pin: z.string().nullish(),
});

type DeviceComponentsFormType = z.infer<typeof DeviceComponentsSchema>;

export default function DeviceDetailPage() {
  const params = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<
    (DeviceComponentsFormType & {id: string}) | null
  >(null);

  const deviceId = params.deviceId as string;
  const greenhouseId = params.greenhouseId as string;

  const {
    data: devices = [],
    isLoading: isLoadingDevices,
    isError: isErrorDevices,
    error: errorDevices,
  } = useGetGreenhouseDeviceDetails(deviceId);

  if (isErrorDevices) {
    toast.error(errorDevices?.message || "Failed to fetch devices");
  }

  const createMutation = useCreateDeviceComponents();
  const updateMutation = useUpdateDeviceComponents();
  const deleteMutation = useDeleteDeviceComponents();

  let device = devices.data;

  if (isLoadingDevices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 font-medium">Loading device details...</p>
      </div>
    );
  }

  if (isErrorDevices) {
    return (
      <div className="p-6 text-red-500 font-medium">
        Terjadi kesalahan saat mengambil data device.
      </div>
    );
  }

  if (Array.isArray(devices.data)) {
    device = responseData[0]; // Ambil elemen pertama jika bentuknya array
  }

  if (!device) {
    return (
      <div className="p-6 text-gray-500">
        Device tidak ditemukan atau data kosong.
      </div>
    );
  }

  console.log(device);

  const handleOpenAdd = () => {
    if (!greenhouseId) {
      toast.warning("Please select a greenhouse first!");
      return;
    }
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: DeviceComponentsType) => {
    if (!greenhouseId) {
      toast.warning("Please select a greenhouse first!");
      return;
    }
    setSelectedData({
      id: row.id,
      name: row.name,
      type: row.type,
      category: row.category,
      unit: row.unit,
      pin: row.pin,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (data: DeviceComponentsFormType) => {
    if (selectedData) {
      console.log(selectedData);
      updateMutation.mutate(
        {
          componentId: selectedData.id,
          deviceId: deviceId,
          idGreenhouse: greenhouseId,
          ...data,
        },
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Greenhouse updated successfully");
            setIsModalOpen(false);
            window.location.reload();
          },
          onError: (err: any) => toast.error(err.message),
        },
      );
    } else {
      createMutation.mutate(
        {
          idDevice: deviceId,
          idGreenhouse: greenhouseId,
          ...data,
        },
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Greenhouse created successfully");
            setIsModalOpen(false);
            window.location.reload();
          },
          onError: (err: any) => toast.error(err.message),
        },
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this greenhouse?")) {
      deleteMutation.mutate(
        {componentId: id, deviceId: deviceId, idGreenhouse: greenhouseId},
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Greenhouse deleted successfully");
            window.location.reload();
          },
          onError: (error: any) => {
            toast.error(error.message);
          },
        },
      );
    }
  };

  const typeDevice = deviceType.map((type) => ({
    label: type.name,
    value: type.value,
  }));

  const DevicesField: FormFieldConfig[] = [
    {
      name: "name",
      label: "Name",
      placeholder: "e.g., Operator, Admin",
    },
    {
      name: "type",
      label: "Type",
      type: "select",
      options: typeDevice,
    },
    {
      name: "category",
      label: "Category",
      placeholder:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quae, rerum.",
    },
    {
      name: "unit",
      label: "Unit",
      placeholder:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quae, rerum.",
    },
    {
      name: "pin",
      label: "Pin",
      placeholder:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quae, rerum.",
    },
  ];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* <Button
            variant="ghost"
            className="p-2 border border-gray-200 hover:bg-gray-100"
            onClick={() => router.push(`/greenhouse/${greenhouseId}/devices`)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button> */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{device.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Cpu className="w-4 h-4" /> Device ID: {device.id}
            </p>
          </div>
        </div>

        {/* Status Badge di Pojok Kanan Atas */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${device.status === "ONLINE" ? "bg-green-400" : "bg-red-400"}`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${device.status === "ONLINE" ? "bg-green-500" : "bg-red-500"}`}
            ></span>
          </span>
          <span className="text-sm font-semibold text-gray-700">
            {device.status === "ONLINE" ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KIRI: Informasi Detail Device (1 Kolom) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Device Information
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">MAC Address</p>
                <div className="flex items-center gap-2 text-gray-800 font-medium bg-gray-50 p-2 rounded-md border border-gray-100">
                  <Wifi className="w-4 h-4 text-gray-400" />
                  {device.macAddress}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Area Lokasi</p>
                <div className="flex items-center gap-2 text-gray-800 font-medium bg-gray-50 p-2 rounded-md border border-gray-100">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {device.area.name || "Belum di-assign ke area"}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Terakhir Aktif (Ping)
                </p>
                <p className="text-gray-800 font-medium">
                  {device.lastPing === null
                    ? new Date(device.lastPing).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "null"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KANAN: Daftar Komponen Device (2 Kolom) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-green-500" />
                Device Components
              </h2>
              <Button
                onClick={handleOpenAdd}
                variant="primary"
                className="text-sm py-1.5 px-3"
              >
                + Add Component
              </Button>
            </div>

            {/* List Components */}
            <div className="space-y-3">
              {device.components.map((comp: any) => {
                return (
                  <div
                    key={comp.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-green-200 transition-colors bg-gray-50/50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-md ${comp.type === "SENSOR" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}
                      >
                        {/* <IconComponent className="w-5 h-5" /> */}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {comp.name}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {comp.type}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">
                        {comp.value}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        {comp.status}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleOpenEdit(comp)}
                        variant="ghost"
                        className="p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(comp.id)}
                        variant="ghost"
                        className="p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {device.components.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <p>Tidak ada komponen yang terhubung ke device ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <GenericFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedData ? "Edit Device" : "Add Device"}
        schema={DeviceComponentsSchema}
        fields={DevicesField}
        defaultValues={
          selectedData
            ? {
                name: selectedData.name,
                type: selectedData.type,
                category: selectedData.category || "",
                unit: selectedData.unit || "",
                pin: selectedData.pin || "",
              }
            : {
                name: "",
                type: "SENSOR",
                category: "",
                unit: "",
                pin: "",
              }
        }
        onSubmit={handleSubmitForm}
        isLoading={isPending}
        submitText={selectedData ? "Save Changes" : "Create"}
      />
    </div>
  );
}
