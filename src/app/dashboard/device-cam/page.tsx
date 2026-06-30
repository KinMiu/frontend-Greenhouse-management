/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Button from "@/src/components/ui/button";
import GenericFormModal, {
  FormFieldConfig,
} from "@/src/components/ui/genericFormModal";
import Table, {TableColumn} from "@/src/components/ui/tabel";
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

// ==========================================
// DATA DUMMY
// ==========================================
const dummyGreenhouses = [
  {id: "dummy-gh-01", name: "Greenhouse Testing Dummy"},
];

const dummyAreas = [{id: "dummy-area-01", name: "Area Pemantauan Kamera"}];

const dummyDevices: any[] = [
  {
    id: "dummy-cam-01",
    name: "Kamera Utama (Dummy Worker)",
    type: "CAMERA",
    macAddress: "FF:EE:DD:CC:BB:AA",
    status: "ONLINE",
    areaId: "dummy-area-01",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function DevicePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<
    (DeviceFormType & {id: string}) | null
  >(null);

  // Set default state menggunakan ID dari data dummy
  const [selectedGreenhouseId, setSelectedGreenhouseId] = useState<string>(
    dummyGreenhouses[0].id,
  );

  // Karena kita pakai data dummy, state loading kita set false
  const isLoadingDevices = false;
  const isPending = false;

  const handleOpenAdd = () => {
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: DeviceType) => {
    setSelectedData({
      id: row.id,
      name: row.name,
      // @ts-ignore - mengabaikan error type sementara jika di type asli tidak ada
      type: row.type,
      macAddress: row.macAddress,
      status: "OFFLINE",
      areaId: row.areaId,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (data: DeviceFormType) => {
    // Simulasi proses submit berhasil
    toast.success("Berhasil menyimpan data (Simulasi Dummy)!");
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this device?")) {
      // Simulasi proses delete
      toast.success("Device deleted successfully (Simulasi Dummy)");
    }
  };

  const areasConfig = dummyAreas.map((area: any) => ({
    label: area.name,
    value: area.id,
  }));

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
    {
      name: "areaId",
      label: "Area ID",
      type: "select",
      placeholder: "Pilih Area penempatan alat...",
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
          <div className="flex flex-row gap-2">
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
          {/* Tombol ini akan mengarahkan ke halaman detail dummy */}
          <Button
            onClick={() =>
              router.push(
                `/dashboard/device-cam/${selectedGreenhouseId}/${row.id}`,
              )
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Device Management
          </h1>
          <p className="text-gray-500">Manage your greenhouse devices</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedGreenhouseId}
            onChange={(e) => setSelectedGreenhouseId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-green-500 shadow-sm"
          >
            {dummyGreenhouses.map((gh) => (
              <option key={gh.id} value={gh.id}>
                {gh.name}
              </option>
            ))}
          </select>
        </div>

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
          data={dummyDevices}
          isLoading={isLoadingDevices}
          emptyMessage="No devices found"
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
                // @ts-ignore
                type: selectedData.type,
                macAddress: selectedData.macAddress,
                status: selectedData.status,
                areaId: selectedData.areaId,
              }
            : {
                name: "",
                type: "CAMERA",
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
