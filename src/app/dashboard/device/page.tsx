/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Button from "@/src/components/ui/button";
import GenericFormModal, {
  FormFieldConfig,
} from "@/src/components/ui/genericFormModal";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {useGetGreenhouseAreas} from "@/src/hooks/use-area";
import {
  useCreateDevice,
  useDeleteDevice,
  useGetGreenhouseDeviceByGreenhouse,
  useUpdateDevice,
} from "@/src/hooks/use-device";
import {useGetMyGreenhouses} from "@/src/hooks/use-greenhouses";
import {AreaType, DeviceType, GreenhousesType} from "@/src/types";
import {motion, AnimatePresence} from "framer-motion";
import {
  Edit,
  Eye,
  Trash2,
  QrCode,
  Keyboard,
  X,
  AlertCircle,
} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect, useState, useRef} from "react";
import {toast} from "sonner";
import z from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Html5QrcodeScanner} from "html5-qrcode";

// Skema Validasi UUID v4 standar
const DeviceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  uuid: z
    .string()
    .min(1, "UUID wajib diisi")
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      {message: "Format harus berupa UUID v4 valid"},
    ),
  areaId: z.string().optional().nullable(),
});

type DeviceFormType = z.infer<typeof DeviceSchema>;

// Skema Khusus Add Perangkat (Hanya meminta UUID saja)
const AddDeviceSchema = z.object({
  uuid: z
    .string()
    .min(1, "UUID wajib diisi")
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      {message: "Format harus berupa UUID v4 valid"},
    ),
});

type AddDeviceFormType = z.infer<typeof AddDeviceSchema>;

export default function DevicePage() {
  const router = useRouter();

  // Kontrol Pisah Modal (Add via Custom, Edit via GenericFormModal)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedData, setSelectedData] = useState<
    (DeviceFormType & {id: string}) | null
  >(null);
  const [selectedGreenhouseId, setSelectedGreenhouseId] = useState<string>("");

  // State Tab & Scanner untuk Add Device Custom Modal
  const [activeTab, setActiveTab] = useState<"manual" | "scan">("manual");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedValue, setScannedValue] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Hook Form untuk Custom Add Modal (Hanya validasi UUID)
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    setValue: setValueAdd,
    reset: resetAdd,
    formState: {errors: errorsAdd},
  } = useForm<AddDeviceFormType>({
    resolver: zodResolver(AddDeviceSchema),
  });

  const {data: greenhouses, isLoading: isLoadingGreenhouse} =
    useGetMyGreenhouses();
  const {data: areas} = useGetGreenhouseAreas(selectedGreenhouseId);
  const {data: devices, isLoading: isLoadingDevices} =
    useGetGreenhouseDeviceByGreenhouse(selectedGreenhouseId);

  const greenhouseList: GreenhousesType[] = (greenhouses as any)?.data || (Array.isArray(greenhouses) ? greenhouses : []);
  const areaList: AreaType[] = (areas as any)?.data || (Array.isArray(areas) ? areas : []);
  const deviceList: DeviceType[] = (devices as any)?.data || (Array.isArray(devices) ? devices : []);

  const createMutation = useCreateDevice();
  const updateMutation = useUpdateDevice();
  const deleteMutation = useDeleteDevice();

  useEffect(() => {
    if (greenhouseList.length > 0 && selectedGreenhouseId === "") {
      setSelectedGreenhouseId(greenhouseList[0].id);
    }
  }, [greenhouseList, selectedGreenhouseId]);

  // Efek Kamera Scan QR di Custom Add Modal
  useEffect(() => {
    if (activeTab === "manual") {
      stopScanner();
    } else if (activeTab === "scan" && isAddModalOpen) {
      startScanner();
    }
  }, [activeTab, isAddModalOpen]);

  useEffect(() => {
    if (!isAddModalOpen) {
      stopScanner();
    }
  }, [isAddModalOpen]);

  const startScanner = () => {
    setIsScanning(true);
    setScannedValue("");

    setTimeout(() => {
      const container = document.getElementById("qr-reader-modal-container");
      if (!container) return;

      const scanner = new Html5QrcodeScanner(
        "qr-reader-modal-container",
        {
          fps: 15,
          qrbox: {width: 220, height: 220},
          aspectRatio: 1.0,
          experimentalFeatures: {useBarCodeDetectorIfSupported: true},
        },
        false,
      );

      scanner.render(
        (decodedText) => {
          setScannedValue(decodedText);
          setValueAdd("uuid", decodedText, {shouldValidate: true});
          toast.success("QR Code UUID berhasil dideteksi!");
          stopScanner(scanner);
        },
        (error) => {
          console.debug(error);
        },
      );

      scannerRef.current = scanner;
    }, 300);
  };

  const stopScanner = (scannerInstance = scannerRef.current) => {
    if (scannerInstance) {
      scannerInstance
        .clear()
        .catch((err) => console.error("Gagal mematikan scanner", err));
    }
    setIsScanning(false);
    scannerRef.current = null;
  };

  // Trigger Aksi Buka Modal Tambah Alat
  const handleOpenAdd = () => {
    if (!selectedGreenhouseId) {
      toast.warning("Please select a greenhouse first!");
      return;
    }
    setScannedValue("");
    setActiveTab("manual");
    resetAdd({uuid: ""});
    setIsAddModalOpen(true);
  };

  // Trigger Aksi Buka Modal Edit Alat (Pakai Generic Form)
  const handleOpenEdit = (row: any) => {
    if (!selectedGreenhouseId) {
      toast.warning("Please select a greenhouse first!");
      return;
    }
    setSelectedData({
      id: row.id,
      name: row.name || "",
      uuid: row.uuid || "",
      areaId: row.areaId || "",
    });
    setIsEditModalOpen(true);
  };

  // Submit Handler untuk Pembuatan Device Baru (Hanya kirim UUID)
  const onAddSubmit = (data: AddDeviceFormType) => {
    updateMutation.mutate(
      {
        id: data.uuid,
        idGreenhouse: selectedGreenhouseId,
        name: "",
        macAddress: "",
        ...data,
      },
      {
        onSuccess: (res: any) => {
          toast.success(res.message || "Device Added successfully");
          setIsAddModalOpen(false);
        },
        onError: (err: any) => toast.error(err.message),
      },
    );
  };

  // Submit Handler untuk Update Device Baru (Melalui GenericFormModal)
  const onEditSubmit = (data: DeviceFormType) => {
    if (!selectedData) return;
    updateMutation.mutate(
      {
        id: selectedData.id,
        idGreenhouse: selectedGreenhouseId,
        name: data.name,
        macAddress: "",
        areaId: data.areaId,
      },
      {
        onSuccess: (res: any) => {
          toast.success(res.message || "Device updated successfully");
          setIsEditModalOpen(false);
        },
        onError: (err: any) => toast.error(err.message),
      },
    );
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this device?")) {
      deleteMutation.mutate(
        {id: id, idGreenhouse: selectedGreenhouseId},
        {
          onSuccess: (res: any) =>
            toast.success(res.message || "Device deleted successfully"),
          onError: (error: any) => toast.error(error.message),
        },
      );
    }
  };

  // Generator Opsi Dropdown Area untuk Keperluan Edit Modal
  const areasConfig =
    areaList.map((area: any) => ({
      label: area.name,
      value: area.id,
    })) || [];

  // Konfigurasi Input Field Generic Form Modal (Hanya Terpakai Pas Edit)
  const EditFieldsConfig: FormFieldConfig[] = [
    {
      name: "name",
      label: "Name",
      placeholder: "e.g., ESP32 Sensor Suhu, Node Pompa 1",
    },
    {
      name: "uuid",
      label: "Device UUID",
      placeholder: "Masukkan 36-karakter kode UUID alat...",
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
      header: "MAC Address",
      cell: (row) => (
        <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono border border-gray-200 text-gray-700">
          {row.macAddress}
        </code>
      ),
    },
    {
      header: "Created At",
      cell: (row) => (
        <div>
          <p>
            {row.createdAt
              ? new Date(row.createdAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "-"}
          </p>
        </div>
      ),
    },
    {
      header: "Updated At",
      cell: (row) => (
        <div>
          <p>
            {row.updatedAt
              ? new Date(row.updatedAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "-"}
          </p>
        </div>
      ),
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
      {/* Header Halaman */}
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
            disabled={isLoadingGreenhouse}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-green-500 shadow-sm"
          >
            {greenhouseList.map((gh: GreenhousesType) => (
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

      {/* Tabel Utama */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.4}}
      >
        <Table
          columns={columns}
          data={deviceList}
          isLoading={isLoadingDevices}
          emptyMessage="No devices found"
        />
      </motion.div>

      {/* 1. CUSTOM MODAL UNTUK ADD DEVICE (Hanya Form UUID + Fitur Scan QR) */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{opacity: 0, scale: 0.95}}
              animate={{opacity: 1, scale: 1}}
              exit={{opacity: 0, scale: 0.95}}
              className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 flex flex-col"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">
                  Add Device via UUID
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmitAdd(onAddSubmit)}
                className="p-6 space-y-4 flex-1 text-left"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 block">
                    Device UUID
                  </label>

                  {/* Tab Selector Buttons */}
                  <div className="flex border-b border-gray-200">
                    <button
                      type="button"
                      className={`flex items-center gap-2 py-2 px-4 text-xs font-medium border-b-2 transition-all ${
                        activeTab === "manual"
                          ? "border-green-600 text-green-600"
                          : "border-transparent text-gray-500"
                      }`}
                      onClick={() => setActiveTab("manual")}
                    >
                      <Keyboard className="w-3.5 h-3.5" /> Input Manual
                    </button>
                    <button
                      type="button"
                      className={`flex items-center gap-2 py-2 px-4 text-xs font-medium border-b-2 transition-all ${
                        activeTab === "scan"
                          ? "border-green-600 text-green-600"
                          : "border-transparent text-gray-500"
                      }`}
                      onClick={() => setActiveTab("scan")}
                    >
                      <QrCode className="w-3.5 h-3.5" /> Scan via Kamera
                    </button>
                  </div>

                  {/* Render Berdasarkan Tab Aktif */}
                  {activeTab === "manual" ? (
                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="Masukkan 36-karakter kode UUID alat..."
                        {...registerAdd("uuid")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 font-mono"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">
                          Jendela Pindai QR
                        </span>
                        {isScanning && (
                          <span className="text-red-500 animate-pulse flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />{" "}
                            Camera On
                          </span>
                        )}
                      </div>

                      <div className="overflow-hidden rounded border border-gray-300 bg-black min-h-[160px] flex items-center justify-center">
                        <div
                          id="qr-reader-modal-container"
                          className="w-full text-black"
                        />
                      </div>

                      {scannedValue && (
                        <div className="text-[11px] p-2 bg-green-50 text-green-800 border border-green-200 rounded font-mono break-all">
                          ✔ Hasil Scan: {scannedValue}
                        </div>
                      )}

                      <input type="hidden" {...registerAdd("uuid")} />
                    </div>
                  )}
                  {errorsAdd.uuid && (
                    <p className="text-xs text-red-500">
                      {errorsAdd.uuid.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-red-500 text-white font-medium text-sm rounded-lg hover:bg-red-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {isPending ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. MODAL STANDAR (GENERIC FORM) UNTUK EDIT DEVICE */}
      {selectedData && (
        <GenericFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Device"
          schema={DeviceSchema}
          fields={EditFieldsConfig}
          defaultValues={{
            name: selectedData.name,
            uuid: selectedData.id,
            areaId: selectedData.areaId,
          }}
          onSubmit={onEditSubmit}
          isLoading={isPending}
          submitText="Save Changes"
        />
      )}
    </div>
  );
}
