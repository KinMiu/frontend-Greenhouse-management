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
  ArrowRight,
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
  const [mainTablePage, setMainTablePage] = useState(1); // Untuk Tabel Komponen Utama
  const [sensorPage, setSensorPage] = useState(1); // Untuk Tabel Sensor di Modal
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
  const sensorPagination = sensorResponse?.data.pagination;
  console.log(sensorResponse);

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

    // 1. Pastikan URL & Port benar (Gunakan ws/wss untuk Browser)
    // Pakai port 8083 untuk ws atau 8084 untuk wss
    const brokerUrl = "wss://urken.psti-ubl.id/ws-rabbitmq";

    const client = mqtt.connect(brokerUrl, {
      username: "/smk2pkl:smk2iot",
      password: "smk2iot",
      clientId: `web_${Math.random().toString(16).slice(3)}`,
    });

    client.on("connect", () => {
      const topic = `sensor/${device.macAddress}`;
      client.subscribe(topic);
      console.log(`✅ Connected! Listening to: ${topic}`);
    });

    client.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        console.log("📩 Raw MQTT Payload:", payload);

        // 2. AMBIL DATA BERDASARKAN PIN/ID (Bukan .value)
        // selectedComp.pin harus berisi ID seperti UUID yang dikirim load tester
        const targetKey = selectedComp.id;
        const incomingValue = payload[targetKey];

        // Cek apakah data untuk komponen ini ada di dalam payload
        if (incomingValue !== undefined) {
          setChartData((prev) => {
            const newData = [
              ...prev,
              {
                time: new Date().toLocaleTimeString("id-ID", {hour12: false}),
                value: Number(incomingValue), // Pastikan jadi angka
              },
            ];
            return newData.slice(-15);
          });
        } else {
          console.warn(`⚠️ Key "${targetKey}" tidak ditemukan di payload`);
        }
      } catch (err) {
        console.error("❌ Failed to parse MQTT message", err);
      }
    });

    client.on("error", (err) => {
      console.error("❌ MQTT Connection Error:", err);
    });

    return () => {
      console.log("🔌 Cleaning up MQTT connection...");
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
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          {/* <Button
            onClick={() => handleOpenedHistory(device.statusLogs, true)}
            variant="ghost"
            className="p-2 text-purple-600 hover:bg-purple-50"
          >
            <History className="w-4 h-4" />
          </Button> */}
        </div>
      </div>

      {/* 3. COMPONENTS TABLE WITH PAGINATION */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className="space-y-4"
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
              {/* Tombol Previous */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 border border-gray-200 bg-white"
                disabled={mainTablePage === 1}
                onClick={() => setMainTablePage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {/* Nomor Halaman Digital */}
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

              {/* Tombol Next */}
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

      {/* 4. MODAL ADD/EDIT COMPONENT */}
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

      {/* 5. MODAL STATUS HISTORY */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{opacity: 0, scale: 0.95}}
              animate={{opacity: 1, scale: 1}}
              exit={{opacity: 0, scale: 0.95}}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <History className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-800">Connection Logs</h3>
                </div>
                <button
                  onClick={() => handleOpenedHistory([], false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <div className="p-6">
                <div className="max-h-[400px] overflow-y-auto rounded-xl border border-gray-100">
                  <Table
                    columns={historyColumns}
                    data={historyLogs || []}
                    emptyMessage="No connection logs recorded."
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 text-right">
                <Button
                  variant="primary"
                  onClick={() => handleOpenedHistory([], false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL COMPONENT DATA HISTORY (Sensor Readings) */}
      <AnimatePresence>
        {isCompDetailOpen && selectedComp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{opacity: 0, scale: 0.95, y: 20}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.95, y: 20}}
              className="bg-white sm:rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[95vh]"
            >
              {/* Header */}
              <div className="px-8 py-5 border-b flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 ring-1 ring-emerald-100">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-gray-900 tracking-tight">
                      {selectedComp.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                        {selectedComp.category}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                        • {selectedComp.unit}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsCompDetailOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                >
                  <Plus className="w-7 h-7 text-gray-400 rotate-45 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              {/* Content Body */}
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Left Column: Chart Area (Main) */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />{" "}
                        Performance Analysis
                      </h4>
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                          Real-time
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-3xl h-[300px] lg:h-[400px] p-4">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="time"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              unit={selectedComp.unit}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#10b981" // emerald-500
                              strokeWidth={3}
                              dot={{r: 4, fill: "#10b981"}}
                              activeDot={{r: 6}}
                              animationDuration={300}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <Activity className="w-8 h-8 mb-2 animate-pulse" />
                          <p className="text-sm">Waiting for MQTT data...</p>
                          <code className="text-[10px] mt-1">
                            Topic: greenhouse/data/{device.macAddress}/
                            {selectedComp.pin}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Table Readings */}
                  <div className="lg:col-span-2 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-500" /> Recent
                        Logs
                      </h4>
                    </div>

                    <div className="flex-grow rounded-2xl border border-gray-100 overflow-hidden shadow-sm bg-white">
                      <Table
                        isLoading={isLoadingSensor}
                        columns={[
                          {
                            header: "Timestamp",
                            cell: (r) => (
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-700 text-[11px]">
                                  {new Date(r.createdAt).toLocaleTimeString(
                                    "id-ID",
                                    {hour: "2-digit", minute: "2-digit"},
                                  )}
                                </span>
                                <span className="text-[9px] text-gray-400 uppercase">
                                  {new Date(r.createdAt).toLocaleDateString(
                                    "id-ID",
                                  )}
                                </span>
                              </div>
                            ),
                          },
                          {
                            header: "Value",
                            cell: (r) => (
                              <span className="font-black text-emerald-600 text-sm">
                                {r.value}{" "}
                                <span className="text-[10px] font-medium text-gray-400">
                                  {selectedComp.unit}
                                </span>
                              </span>
                            ),
                          },
                          {
                            header: "Status",
                            cell: () => (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/10">
                                STABLE
                              </span>
                            ),
                          },
                        ]}
                        data={sensorData.data || []}
                      />
                    </div>

                    {/* Enhanced Pagination */}
                    {sensorPagination && sensorPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
                        <p className="text-[10px] text-gray-500 font-bold ml-2">
                          {sensorPagination.currentPage}{" "}
                          <span className="text-gray-300 mx-1">/</span>{" "}
                          {sensorPagination.totalPages}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 rounded-lg bg-white border shadow-sm flex justify-center items-center ${sensorPage === 1 ? "opacity-50" : "hover:bg-emerald-50"}`}
                            disabled={sensorPage === 1}
                            onClick={() => setSensorPage((p) => p - 1)}
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 rounded-lg bg-white border shadow-sm flex justify-center items-center ${sensorPage >= sensorPagination.totalPages ? "opacity-50" : "hover:bg-emerald-50"}`}
                            disabled={sensorPage >= sensorPagination.totalPages}
                            onClick={() => setSensorPage((p) => p + 1)}
                          >
                            <ArrowRight className="w-4 h-4 " />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 bg-gray-50/50 border-t flex justify-end gap-3">
                <button
                  onClick={() => setIsCompDetailOpen(false)}
                  className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95"
                >
                  Done
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
