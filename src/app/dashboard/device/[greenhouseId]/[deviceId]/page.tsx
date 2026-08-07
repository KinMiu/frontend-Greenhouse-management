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
  Clock,
  ArrowLeft,
  Fan,
  History,
  ChevronLeft,
  ChevronRight,
  Video,
  AlertCircle,
  X,
} from "lucide-react";
import Button from "@/src/components/ui/button";
import {useGetGreenhouseDeviceDetails} from "@/src/hooks/use-device";
import z from "zod";
import GenericFormModal from "@/src/components/ui/genericFormModal";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {toast} from "sonner";
import {useState, useMemo, useEffect, useRef} from "react";
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

  // -- States Umum --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any>(null);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isCompDetailOpen, setIsCompDetailOpen] = useState(false);
  const [selectedComp, setSelectedComp] = useState<any>(null);

  // -- Pagination States --
  const [mainTablePage, setMainTablePage] = useState(1);
  const [sensorPage, setSensorPage] = useState(1);
  const itemsPerPage = 5;

  const deviceId = params.deviceId as string;
  const greenhouseId = params.greenhouseId as string;

  // -- Camera Stream States (WebSocket) --
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [cameraFrame, setCameraFrame] = useState<string | null>(null);
  const [wsFrameCount, setWsFrameCount] = useState(0);
  const prevWsUrlRef = useRef<string | null>(null);

  // -- States Grafik MQTT --
  const [chartData, setChartData] = useState<{time: string; value: number}[]>(
    [],
  );

  // --- DATA FETCHING (Profil Device Utama) ---
  const {
    data: response,
    isLoading,
    isError,
  } = useGetGreenhouseDeviceDetails(deviceId);
  const device = response?.data;

  // --- LOGIKA PINTAR PENENTU TAMPILAN KAMERA ---
  // Memeriksa properti device.type ATAU mendeteksi apakah salah satu komponen bertipe "CAMERA"
  const isCameraDevice = useMemo(() => {
    if (!device) return false;
    const hasCameraComponent = device.components?.some(
      (comp: any) => comp.type === "CAMERA",
    );
    return device.type === "CAMERA" || hasCameraComponent;
  }, [device]);

  // --- DATA FETCHING (Sensor Log dari DB untuk Modal) ---
  const {data: sensorResponse, isLoading: isLoadingSensor} =
    useGetGreenhouseDeviceComponentSensor(
      greenhouseId,
      selectedComp?.id,
      sensorPage,
    );
  const sensorDataArray = sensorResponse?.data || [];
  const sensorPagination = sensorResponse?.data.pagination;

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
  const handleOpenCompDetail = (component: any) => {
    setSelectedComp(component);
    setSensorPage(1);
    setIsCompDetailOpen(true);
  };

  const handleOpenedHistory = (data: any, y: boolean) => {
    setIsHistoryOpen(y);
    setHistoryLogs(data);
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

  // --- EFFECT 1: WebSocket Camera Stream ---
  useEffect(() => {
    if (!device || !isCameraDevice || !device.macAddress) return;

    const cleanMac = device.macAddress;
    const wsUrl = `wss://urken.psti-ubl.id/ws/viewer?mac=${cleanMac}`;

    console.log(`📡 Initiating Camera WS stream for: ${cleanMac}`);
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "blob";

    ws.onopen = () => {
      console.log(`✅ Camera WS Connected [${cleanMac}]`);
      setIsWsConnected(true);
    };

    ws.onmessage = (event) => {
      // Karena backend sudah kirim BinaryMessage, event.data otomatis dibaca sebagai Blob oleh browser
      if (event.data instanceof Blob) {
        if (prevWsUrlRef.current) {
          URL.revokeObjectURL(prevWsUrlRef.current);
        }
        const newFrameUrl = URL.createObjectURL(event.data);
        setCameraFrame(newFrameUrl);
        prevWsUrlRef.current = newFrameUrl;
        setWsFrameCount((prev) => prev + 1);
      } else {
        console.log("Data masuk tapi bukan Blob:", typeof event.data);
      }
    };

    ws.onclose = (event) => {
      console.warn("❌ Camera WS Disconnected!", event.code);
      setIsWsConnected(false);
      setCameraFrame(null);
    };

    ws.onerror = (error) => {
      console.error("⚠️ Camera WS Error:", error);
    };

    return () => {
      console.log("🔌 Cleaning up Camera WS connection...");
      ws.close();
      if (prevWsUrlRef.current) {
        URL.revokeObjectURL(prevWsUrlRef.current);
      }
    };
  }, [device?.macAddress, isCameraDevice]);

  // --- EFFECT 2: MQTT Real-time Chart ---
  useEffect(() => {
    if (
      !isCompDetailOpen ||
      !device?.macAddress ||
      !selectedComp ||
      selectedComp.type !== "SENSOR"
    )
      return;

    const brokerUrl = "wss://urken.psti-ubl.id/ws-rabbitmq";
    const client = mqtt.connect(brokerUrl, {
      username: "/smk2pkl:smk2iot",
      password: "smk2iot",
      clientId: `web_${Math.random().toString(16).slice(3)}`,
    });

    client.on("connect", () => {
      const topic = `sensor/${device.macAddress}`;
      client.subscribe(topic);
      console.log(`✅ MQTT Connected! Listening topic: ${topic}`);
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
      console.log("🔌 Cleaning up MQTT connection...");
      client.end();
      setChartData([]);
    };
  }, [isCompDetailOpen, device?.macAddress, selectedComp]);

  // --- COLUMNS CONFIG (Main Table Components) ---
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
          {row.type === "SENSOR" && (
            <Button
              onClick={() => handleOpenCompDetail(row)}
              variant="ghost"
              className="p-2 text-emerald-600 hover:bg-emerald-50"
              title="Real-time Monitor"
            >
              <Activity className="w-4 h-4" />
            </Button>
          )}
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

  // --- COLUMNS CONFIG (History Logs Modal) ---
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
            <span className="text-[9px] text-gray-400 uppercase">
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
      <div className="p-10 text-center text-red-500 border border-red-200 rounded-xl bg-red-50">
        Error: Device profile not found.
      </div>
    );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="p-2 border border-gray-200 bg-white shadow-sm hover:bg-gray-50 rounded-xl"
            onClick={() => router.push(`/dashboard/device`)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {device.name}
            </h1>
            <p className="text-gray-500 text-sm">
              {isCameraDevice
                ? "Live Video Stream Dashboard"
                : "Hardware Configuration Node"}
            </p>
          </div>
        </div>

        <div className="flex flex-row justify-center items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-full font-bold text-[11px] flex items-center gap-2 border shadow-inner transition-all ${
              isCameraDevice
                ? isWsConnected
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-rose-50 text-rose-600 border-rose-200"
                : "bg-emerald-50 text-emerald-600 border-emerald-200"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isCameraDevice && !isWsConnected ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`}
            />
            {isCameraDevice
              ? isWsConnected
                ? "WS LIVE"
                : "WS OFFLINE"
              : "NODE ONLINE"}
          </div>

          <Button
            onClick={() => handleOpenedHistory(device.statusLogs, true)}
            variant="danger"
            className="p-2.5 rounded-xl shadow-sm"
            title="View Connection Logs"
          >
            <History className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 2. DEVICE INFO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          label="Hardware MAC"
          val={device.macAddress}
          icon={Wifi}
          color="text-blue-500 bg-blue-50"
        />
        <InfoCard
          label="Location"
          val={device.area?.name || "Global Node"}
          icon={MapPin}
          color="text-orange-500 bg-orange-50"
        />

        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm hover:border-gray-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                Last Seen
              </p>
              <p className="text-xs font-bold font-mono text-gray-700">
                {device.lastSeen
                  ? new Date(device.lastSeen).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "NEVER"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ADAPTIVE CONTENT AREA */}
      {isCameraDevice ? (
        // ================= TAMPILAN JIKA KAMERA (Hanya Stream) =================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <motion.div
            initial={{opacity: 0, y: 15}}
            animate={{opacity: 1, y: 0}}
            className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col"
          >
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-500" />
                Live CCTV Stream
              </h3>
              {isWsConnected && cameraFrame && (
                <span className="text-[9px] bg-rose-500 text-white font-black uppercase tracking-widest px-2 py-0.5 rounded-sm animate-pulse">
                  LIVE
                </span>
              )}
            </div>

            <div className="relative w-full aspect-video max-h-[480px] bg-zinc-950 flex items-center justify-center overflow-hidden border-t border-gray-900">
              {cameraFrame ? (
                <img
                  src={cameraFrame}
                  alt="Live Camera Stream"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-500 gap-3 p-8 border border-dashed border-zinc-700 rounded-2xl bg-zinc-900">
                  {isWsConnected ? (
                    <>
                      <Activity className="w-10 h-10 animate-spin text-green-500" />
                      <p className="text-xs font-medium tracking-wide text-zinc-400 text-center">
                        Connecting successfully.
                        <br />
                        Decoding incoming binary frames...
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-10 h-10 text-rose-600" />
                      <p className="text-xs font-medium text-zinc-500 text-center">
                        Stream offline or blocked.
                        <br />
                        Awaiting camera handshake / HTTPS check.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
              Stream Metrics
            </h4>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                  Protocol
                </p>
                <p className="text-sm font-bold text-gray-700 font-mono mt-0.5">
                  WebSocket (Binary Blob)
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-500">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                  Data Throughput
                </p>
                <p className="text-sm font-bold text-gray-700 font-mono mt-0.5">
                  {wsFrameCount.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    frames received
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ================= TAMPILAN JIKA SENSOR/ACTUATOR (Hanya Tabel Component) =================
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.4}}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-500" /> Attached Hardware
              Components
            </h3>
          </div>

          <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <Table
              columns={columns}
              data={paginatedComponents}
              emptyMessage="No components attached to this node."
            />
          </div>

          {totalMainPages > 1 && (
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-2">
                Showing {paginatedComponents.length} of{" "}
                {device?.components.length} components
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 border border-gray-200 bg-white rounded-lg hover:bg-gray-50"
                  disabled={mainTablePage === 1}
                  onClick={() => setMainTablePage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({length: totalMainPages}, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setMainTablePage(pageNum)}
                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${mainTablePage === pageNum ? "bg-emerald-500 text-white shadow-md" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                      >
                        {pageNum}
                      </button>
                    ),
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 border border-gray-200 bg-white rounded-lg hover:bg-gray-50"
                  disabled={mainTablePage >= totalMainPages}
                  onClick={() => setMainTablePage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* --- 4. MODAL EDIT CONFIGURATION --- */}
      <GenericFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Component Configuration"
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
          {name: "pin", label: "Pin/Key (MQTT Payload Key)"},
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

      {/* --- 5. MODAL CONNECTION LOGS --- */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{opacity: 0, scale: 0.95}}
              animate={{opacity: 1, scale: 1}}
              exit={{opacity: 0, scale: 0.95}}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
                    <History className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-800">
                    Node Connection Logs
                  </h3>
                </div>
                <button
                  onClick={() => handleOpenedHistory([], false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
                <Table
                  columns={historyColumns}
                  data={historyLogs || []}
                  emptyMessage="No connection logs recorded for this node."
                />
              </div>
              <div className="px-6 py-4 bg-gray-50/50 border-t flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => handleOpenedHistory([], false)}
                  className="px-5 rounded-lg"
                >
                  Close Logs
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- 6. MODAL SENSOR REAL-TIME MONITOR (MQTT) --- */}
      <AnimatePresence>
        {isCompDetailOpen && selectedComp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{opacity: 0, scale: 0.95, y: 20}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.95, y: 20}}
              className="bg-white sm:rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[95vh] border border-gray-100"
            >
              <div className="px-8 py-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 ring-1 ring-emerald-100 shadow-inner">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-gray-900 tracking-tight">
                      {selectedComp.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md font-black uppercase tracking-wider">
                        {selectedComp.category || "Uncategorized"}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                        • Unit: {selectedComp.unit || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsCompDetailOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto flex-grow bg-gray-50/30">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />{" "}
                        Real-time Performance Analysis
                      </h4>
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                        Live MQTT Stream
                      </span>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-3xl h-[300px] lg:h-[420px] p-5 shadow-sm">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{top: 10, right: 10, left: -20, bottom: 0}}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f5f5f5"
                            />
                            <XAxis
                              dataKey="time"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              stroke="#a0a0a0"
                              dy={10}
                            />
                            <YAxis
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              stroke="#a0a0a0"
                              dx={-5}
                              unit={selectedComp.unit}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#10b981"
                              strokeWidth={3}
                              dot={{
                                r: 4,
                                fill: "#10b981",
                                strokeWidth: 2,
                                stroke: "#fff",
                              }}
                              activeDot={{r: 6, stroke: "#fff", strokeWidth: 2}}
                              animationDuration={300}
                              isAnimationActive={true}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                          <Activity className="w-10 h-10 animate-pulse text-emerald-300" />
                          <p className="text-sm font-medium">
                            Awaiting incoming MQTT data...
                          </p>
                          <code className="text-[10px] mt-1 bg-white px-3 py-1 rounded-md border border-gray-100 shadow-xs font-mono">
                            Topic: sensor/{device.macAddress} (Key:{" "}
                            {selectedComp.id})
                          </code>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-500" /> Recent
                        Logged Readings
                      </h4>
                    </div>

                    <div className="flex-grow rounded-3xl border border-gray-100 overflow-hidden shadow-sm bg-white min-h-[300px]">
                      <Table
                        isLoading={isLoadingSensor}
                        columns={[
                          {
                            header: "Timestamp",
                            cell: (r) => (
                              <div className="flex flex-col font-mono text-[11px]">
                                <span className="font-bold text-gray-700">
                                  {new Date(r.createdAt)
                                    .toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                      hour12: false,
                                    })
                                    .replace(/\./g, ":")}
                                </span>
                                <span className="text-[9px] text-gray-400 uppercase font-sans">
                                  {new Date(r.createdAt).toLocaleDateString(
                                    "id-ID",
                                    {day: "2-digit", month: "short"},
                                  )}
                                </span>
                              </div>
                            ),
                          },
                          {
                            header: "Value",
                            cell: (r) => (
                              <span className="font-black text-emerald-600 text-sm tracking-tight">
                                {Number(r.value).toFixed(
                                  selectedComp.category
                                    ?.toLowerCase()
                                    .includes("ph")
                                    ? 2
                                    : 1,
                                )}{" "}
                                <span className="text-[10px] font-medium text-gray-400 font-sans">
                                  {selectedComp.unit}
                                </span>
                              </span>
                            ),
                          },
                          {
                            header: "Status",
                            cell: () => (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/10">
                                VALID
                              </span>
                            ),
                          },
                        ]}
                        data={sensorDataArray.data || []}
                      />
                    </div>

                    {sensorPagination && sensorPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm mt-auto">
                        <p className="text-[10px] text-gray-500 font-bold ml-2">
                          Page {sensorPagination.currentPage}{" "}
                          <span className="text-gray-300 mx-1">/</span>{" "}
                          {sensorPagination.totalPages}
                        </p>
                        <div className="flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 rounded-lg bg-white border shadow-sm ${sensorPage === 1 ? "opacity-50" : "hover:bg-emerald-50"}`}
                            disabled={sensorPage === 1}
                            onClick={() => setSensorPage((p) => p - 1)}
                          >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 rounded-lg bg-white border shadow-sm ${sensorPage >= sensorPagination.totalPages ? "opacity-50" : "hover:bg-emerald-50"}`}
                            disabled={sensorPage >= sensorPagination.totalPages}
                            onClick={() => setSensorPage((p) => p + 1)}
                          >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-gray-50/50 border-t flex justify-end gap-3 sticky bottom-0 z-10">
                <button
                  onClick={() => setIsCompDetailOpen(false)}
                  className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95"
                >
                  Close Monitor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoCard({label, val, icon: Icon, color}: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm hover:border-gray-200 transition-all duration-300 group">
      <div
        className={`p-3 rounded-xl bg-gray-50 ${color} group-hover:scale-105 transition-transform`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
          {label}
        </p>
        <p className="text-xs font-bold text-gray-700 font-mono mt-1 tracking-tight">
          {val}
        </p>
      </div>
    </div>
  );
}
