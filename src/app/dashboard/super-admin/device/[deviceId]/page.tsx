/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {useParams, useRouter} from "next/navigation";
import {
  Cpu,
  Wifi,
  MapPin,
  Activity,
  Trash2,
  Edit,
  Plus,
  Clock,
  ArrowLeft,
  Fan,
  History,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";
import Button from "@/src/components/ui/button";
import {useGetGreenhouseDeviceDetails} from "@/src/hooks/use-device";
import z from "zod";
import GenericFormModal from "@/src/components/ui/genericFormModal";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {toast} from "sonner";
import {useState, useMemo, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {useGetGreenhouseDeviceComponentSensor} from "@/src/hooks/use-deviceComponentSensor";
import {
  useCreateDeviceComponents,
  useDeleteDeviceComponents,
  useUpdateDeviceComponents,
} from "@/src/hooks/use-deviceComponents";
import mqtt from "mqtt";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// --- VALIDATION SCHEMA ---
const DeviceComponentsSchema = z.object({
  name: z.string({required_error: "Name is required"}).min(2).trim(),
  type: z.enum(["SENSOR", "ACTUATOR"], {required_error: "Type is required"}),
  category: z.string().nullish(),
  unit: z.string().nullish(),
  pin: z.string().nullish(),
});

type DeviceComponentsFormType = z.infer<typeof DeviceComponentsSchema>;

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();

  // -- States --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any>(null);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isCompDetailOpen, setIsCompDetailOpen] = useState(false);
  const [selectedComp, setSelectedComp] = useState<any>(null);
  const [chartData, setChartData] = useState<{time: string; value: number}[]>(
    [],
  );

  // -- Pagination States --
  const [mainTablePage, setMainTablePage] = useState(1);
  const [sensorPage, setSensorPage] = useState(1);
  const itemsPerPage = 5;

  const deviceId = params.deviceId as string;
  const greenhouseId = params.greenhouseId as string;

  // --- DATA FETCHING ---
  const {
    data: response,
    isLoading,
    isError,
  } = useGetGreenhouseDeviceDetails(deviceId);
  const device = response?.data;

  // --- FETCH SENSOR DATA ---
  const {data: sensorResponse, isLoading: isLoadingSensor} =
    useGetGreenhouseDeviceComponentSensor(
      greenhouseId,
      selectedComp?.id,
      sensorPage,
    );

  const sensorData = sensorResponse?.data || [];

  // --- CLIENT-SIDE PAGINATION LOGIC (Main Table) ---
  const {paginatedComponents, totalMainPages} = useMemo(() => {
    const components = device?.components || [];
    const totalPages = Math.ceil(components.length / itemsPerPage);
    const start = (mainTablePage - 1) * itemsPerPage;
    return {
      paginatedComponents: components.slice(start, start + itemsPerPage),
      totalMainPages: totalPages,
    };
  }, [device?.components, mainTablePage]);

  // --- MUTATIONS ---
  const createMutation = useCreateDeviceComponents();
  const updateMutation = useUpdateDeviceComponents();
  const deleteMutation = useDeleteDeviceComponents();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // --- HANDLERS ---
  const handlePrint = () => {
    window.print();
  };

  const handleOpenCompDetail = (component: any) => {
    setSelectedComp(component);
    setSensorPage(1);
    setIsCompDetailOpen(true);
  };

  const handleOpenedHistory = (data: any, y: boolean) => {
    setIsHistoryOpen(y);
    setHistoryLogs(data);
  };

  const handleOpenAdd = () => {
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: any) => {
    setSelectedData({...row});
    setIsModalOpen(true);
  };

  const handleSubmitForm = (data: DeviceComponentsFormType) => {
    const options = {
      onSuccess: (res: any) => {
        toast.success(res.message || "Success");
        setIsModalOpen(false);
        window.location.reload();
      },
      onError: (err: any) => toast.error(err.message),
    };

    if (selectedData) {
      updateMutation.mutate(
        {
          componentId: selectedData.id,
          deviceId,
          idGreenhouse: greenhouseId,
          ...data,
        },
        options,
      );
    } else {
      createMutation.mutate(
        {idDevice: deviceId, idGreenhouse: greenhouseId, ...data},
        options,
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this component?")) {
      deleteMutation.mutate(
        {componentId: id, deviceId, idGreenhouse: greenhouseId},
        {
          onSuccess: () => window.location.reload(),
          onError: (err: any) => toast.error(err.message),
        },
      );
    }
  };

  useEffect(() => {
    if (!isCompDetailOpen || !device?.macAddress || !selectedComp) return;

    const brokerUrl = "wss://urken.psti-ubl.id/ws-rabbitmq";

    const client = mqtt.connect(brokerUrl, {
      username: "/smk2pkl:smk2iot",
      password: "smk2iot",
      clientId: `web_${Math.random().toString(16).slice(3)}`,
    });

    client.on("connect", () => {
      const topic = `sensor/${device.macAddress}`;
      client.subscribe(topic);
    });

    client.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const targetKey = selectedComp.id;
        const incomingValue = payload[targetKey];

        if (incomingValue !== undefined) {
          setChartData((prev) => {
            const newData = [
              ...prev,
              {
                time: new Date().toLocaleTimeString("id-ID", {hour12: false}),
                value: Number(incomingValue),
              },
            ];
            return newData.slice(-15);
          });
        }
      } catch (err) {
        console.error("❌ Failed to parse MQTT message", err);
      }
    });

    return () => {
      client.end();
      setChartData([]);
    };
  }, [isCompDetailOpen, device?.macAddress, selectedComp]);

  // --- COLUMNS CONFIG ---
  const columns: TableColumn<any>[] = [
    {
      header: "Component",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${row.type === "SENSOR" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}
          >
            {row.type === "SENSOR" ? (
              <Activity className="w-4 h-4" />
            ) : (
              <Fan className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="font-bold text-gray-800 leading-none">{row.name}</p>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">
              {row.type}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      cell: (row) => row.category || "-",
    },
    {
      header: "Unit",
      cell: (row) => (
        <span className="text-[10px] text-gray-400 font-bold uppercase">
          {row.unit || "-"}
        </span>
      ),
    },
    {
      header: "Pin/Key",
      cell: (row) => (
        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
          {row.pin || "Auto"}
        </code>
      ),
    },
    {
      header: "Action",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => handleOpenCompDetail(row)}
            variant="ghost"
            className="p-2 text-emerald-600 hover:bg-emerald-50"
            title="History"
          >
            <Activity className="w-4 h-4" />
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

  const historyColumns: TableColumn<any>[] = [
    {
      header: "Status",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${row.state === "ONLINE" ? "bg-green-500" : "bg-red-500"}`}
          />
          <span
            className={`text-xs font-bold ${row.state === "ONLINE" ? "text-green-600" : "text-red-600"}`}
          >
            {row.state}
          </span>
        </div>
      ),
    },
    {
      header: "Timestamp",
      cell: (row) => {
        if (!row.createAt) return "-";
        const date = new Date(row.createAt.replace("Z", ""));
        return (
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-700 font-mono">
              {date
                .toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })
                .replace(/\./g, ":")}
            </span>
            <span className="text-[9px] text-gray-400 uppercase font-black">
              {date.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        );
      },
    },
    {
      header: "Remark",
      cell: (row) => (
        <span className="text-[10px] text-gray-400 italic">
          {row.reason || "-"}
        </span>
      ),
    },
  ];

  if (isLoading)
    return (
      <div className="p-10 text-center animate-pulse text-gray-400">
        Loading Device Details...
      </div>
    );
  if (isError || !device)
    return (
      <div className="p-10 text-center text-red-500">
        Error: Device not found.
      </div>
    );

  return (
    <div className="space-y-6 main-container-print">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print-hide">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="p-2 border border-gray-200 bg-white"
            onClick={() => router.push(`/dashboard/device`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{device.name}</h1>
            <p className="text-gray-500 text-sm">
              Hardware Configuration & Monitoring
            </p>
          </div>
        </div>
        <div className="flex flex-row justify-center items-center gap-3">
          <Button
            variant="ghost"
            className="border border-gray-200 bg-white p-2.5"
            onClick={handlePrint}
            title="Print Device Label"
          >
            <Printer className="w-5 h-5 text-gray-600" />
          </Button>

          <Button variant="primary" onClick={handleOpenAdd}>
            + Add Component
          </Button>
          <Button
            onClick={() => handleOpenedHistory(device.statusLogs, true)}
            variant="danger"
          >
            <History className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 2. DEVICE INFO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-hide">
        <InfoCard
          label="Hardware MAC"
          val={device.macAddress}
          icon={Wifi}
          color="text-blue-500"
        />
        <InfoCard
          label="Location"
          val={device.area?.name || "Global Node"}
          icon={MapPin}
          color="text-orange-500"
        />
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-gray-50 text-purple-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-gray-400">
                Last Seen
              </p>
              <p className="text-xs font-bold font-mono">
                {device.lastSeen
                  ? new Date(device.lastSeen).toLocaleTimeString("id-ID")
                  : "NEVER"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. COMPONENTS TABLE */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className="space-y-4 print-hide"
      >
        <Table
          columns={columns}
          data={paginatedComponents}
          emptyMessage="No components found."
        />

        {totalMainPages > 1 && (
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Showing {paginatedComponents.length} of{" "}
              {device?.components.length} components
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 border border-gray-200 bg-white"
                disabled={mainTablePage === 1}
                onClick={() => setMainTablePage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex gap-1">
                {Array.from({length: totalMainPages}, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setMainTablePage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                        mainTablePage === pageNum
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 border border-gray-200 bg-white"
                disabled={mainTablePage >= totalMainPages}
                onClick={() => setMainTablePage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* 4. MODALS */}
      <GenericFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedData ? "Edit Component" : "Add New Component"}
        schema={DeviceComponentsSchema}
        fields={[
          {name: "name", label: "Name"},
          {
            name: "type",
            label: "Type",
            type: "select",
            options: [
              {label: "Sensor", value: "SENSOR"},
              {label: "Actuator", value: "ACTUATOR"},
            ],
          },
          {name: "category", label: "Category"},
          {name: "unit", label: "Unit"},
          {name: "pin", label: "Pin/Key"},
        ]}
        defaultValues={
          selectedData || {
            name: "",
            type: "SENSOR",
            category: "",
            unit: "",
            pin: "",
          }
        }
        onSubmit={handleSubmitForm}
        isLoading={isPending}
      />

      {/* ================= AREA ELEMEN STIKER PRINT BERSIH ================= */}
      <div className="thermal-label-overlay">
        <div className="thermal-card-box">
          {/* Bagian Kiri: QR Code QRServer Engine */}
          <div className="thermal-qr-side">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(deviceId)}`}
              alt="QR Code"
            />
          </div>
          {/* Bagian Kanan: Detail Spesifikasi Perangkat */}
          <div className="thermal-info-side">
            <div className="thermal-info-row">
              <span className="thermal-info-label">Model:</span>
              <span className="thermal-info-value">{device.name}</span>
            </div>
            <div className="thermal-info-row">
              <span className="thermal-info-label">Version:</span>
              <span className="thermal-info-value">1.0</span>
            </div>
            <div className="thermal-info-row">
              <span className="thermal-info-label">SN:</span>
              <span className="thermal-info-value thermal-mono">
                {deviceId}
              </span>
            </div>
            <div className="thermal-info-row">
              <span className="thermal-info-label">MAC:</span>
              <span className="thermal-info-value thermal-mono">
                {device.macAddress}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= GAYA CSS MEDIA PRINT DENGAN Z-INDEX OVERLAY ================= */}
      <style jsx global>{`
        /* Kondisi normal di layar aplikasi */
        .thermal-label-overlay {
          display: none !important;
        }

        @media print {
          /* 1. Sembunyikan component internal di halaman ini */
          .print-hide {
            display: none !important;
          }

          /* 2. Targetkan elemen layout global luar (Sidebar, Navbar, Header Next App) */
          aside, nav, header, .sidebar, .navbar, .topbar, [class*="sidebar"], [class*="navbar"], [class*="header"] {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
          }

          /* 3. Buat overlay stiker mendominasi layar penuh halaman cetak */
          .thermal-label-overlay {
            display: flex !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 90mm !important;
            height: 40mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            z-index: 999999999 !important;
            align-items: center !important;
            justify-content: center !important;
          }

          /* 4. Pembuatan frame stiker sesuai foto referensi */
          .thermal-card-box {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: flex-start !important;
            width: 90mm !important;
            height: 40mm !important;
            max-width: 90mm !important;
            max-height: 40mm !important;
            border: 1px solid #000000 !important;
            border-radius: 4px !important;
            padding: 10px 14px !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
          }

          /* Sisi QR Code */
          .thermal-qr-side {
            width: 28mm !important;
            height: 28mm !important;
            margin-right: 14px !important;
            flex-shrink: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .thermal-qr-side img {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
          }

          /* Sisi Teks / Data */
          .thermal-info-side {
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
            font-family: Arial, sans-serif !important;
            font-size: 6pt !important;
            color: #000000 !important;
            line-height: 1.3 !important;
            flex-grow: 1 !important;
            justify-content: center !important;
          }

          .thermal-info-row {
            display: flex !important;
            align-items: flex-start !important;
          }

          .thermal-info-label {
            font-weight: bold !important;
            min-width: 55px !important;
            flex-shrink: 0 !important;
          }

          .thermal-info-value {
            flex-grow: 1 !important;
            word-break: break-all !important;
          }

          .thermal-mono {
            font-family: "Courier New", Courier, monospace !important;
            font-size: 4.5pt !important;
            font-weight: 500 !important;
          }

          /* Set standar page ukuran label printer */
          @page {
            size: 90mm 40mm;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

function InfoCard({label, val, icon: Icon, color}: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
      <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
          {label}
        </p>
        <p className="text-xs font-bold text-gray-700 font-mono mt-0.5">
          {val}
        </p>
      </div>
    </div>
  );
}
