/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {useGetGreenhouseAreas} from "@/src/hooks/use-area";
import {useGetMyGreenhouses} from "@/src/hooks/use-greenhouses";
import {DeviceType, GreenhousesType} from "@/src/types";
import {AnimatePresence, motion} from "framer-motion";
import {useEffect, useMemo, useState} from "react";
import {
  Activity,
  Cpu,
  Fan,
  History,
  Thermometer,
  Droplets,
  MapPin,
  WifiOff,
  Clock,
  Eye,
  Settings,
  Plus,
  Settings2,
  Edit,
  Trash2,
} from "lucide-react";
import mqtt from "mqtt";
import {useToggleActuator} from "@/src/hooks/use-deviceComponents";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import Button from "@/src/components/ui/button";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {
  useCreateArea,
  useCreateAutomation,
  useGetGreenhouseAreasAutomation,
  useUpdateAutomation,
} from "@/src/hooks/use-automation";
import Badge from "@/src/components/ui/badge";
import GenericFormModal, {
  FormFieldConfig,
} from "@/src/components/ui/genericFormModal";
import z from "zod";

const ConfigSchema = z.object({
  deviceId: z.string().uuid("Invalid device ID format"),
  componentId: z.string().uuid("Invalid component ID format"),
  action: z.string().min(1, "Action is required").trim(),
  time: z.string().min(1, "Time is required").trim(),
  duration: z.string().min(1, "Must be a positive number"),
});

type ConfigFormType = z.infer<typeof ConfigSchema>;

export default function DashboardPage() {
  const router = useRouter();
  const [selectedGreenhouseId, setSelectedGreenhouseId] = useState<string>("");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [selectedDeviceIdInForm, setSelectedDeviceIdInForm] =
    useState<string>("");
  const [selectedData, setSelectedData] = useState<
    (ConfigFormType & {id: string}) | null
  >(null);
  const [realtimeData, setRealtimeData] = useState<{[mac: string]: any}>({});

  // 🔥 STATE BARU: Untuk nyatet kapan terakhir alat ngirim data
  const [lastSeen, setLastSeen] = useState<{[mac: string]: number}>({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddConfigOpen, setIsAddConfigOpen] = useState(false);
  const [now, setNow] = useState(Date.now()); // Stopwatch trigger untuk re-render

  const {data: greenhouses = [], isLoading: isLoadingGreenhouse} =
    useGetMyGreenhouses();
  const {data: areas = [], isLoading: isLoadingAreas} =
    useGetGreenhouseAreas(selectedGreenhouseId);

  const {data: automationConfig = [], isLoading: isLoadingConfig} =
    useGetGreenhouseAreasAutomation(selectedGreenhouseId, selectedAreaId);

  // console.log("id area", selectedAreaId);
  const toggleMutation = useToggleActuator();
  const createMutation = useCreateAutomation();
  const updateMutation = useUpdateAutomation();

  // 🔥 EFFECT BARU: Stopwatch berdetak tiap 1 detik
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const client = mqtt.connect("ws://195.35.23.135:15675/ws", {
      username: "/smk2pkl:smk2iot",
      password: "smk2iot",
      clientId: `nextjs_${Math.random().toString(16).slice(3)}`,
      protocolId: "MQTT",
    });

    client.on("connect", () => {
      console.log("Connected to MQTT Broker via WebSockets");
      client.subscribe(`sensor/#`);
    });

    client.on("message", (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        const macAddress = topic.split("/")[1] || topic;

        setRealtimeData((prev) => ({
          ...prev,
          [macAddress]: {
            ...prev[macAddress],
            ...data,
          },
        }));

        // 🔥 CATAT WAKTU: Tiap ada pesan masuk, catat jamnya!
        setLastSeen((prev) => ({
          ...prev,
          [macAddress]: Date.now(),
        }));
      } catch (e) {
        console.error("Error parsing MQTT message", e);
      }
    });

    return () => {
      if (client) client.end();
    };
  }, []);

  useEffect(() => {
    if (greenhouses.data?.length > 0 && selectedGreenhouseId === "") {
      setSelectedGreenhouseId(greenhouses.data[0].id);
    }
  }, [greenhouses, selectedGreenhouseId]);

  const handleViewHistory = (deviceId: string) => {
    toast.info("Fitur riwayat sedang dalam pengembangan");
  };

  const handleOpenedHistory = (idArea: string) => {
    router.push(`/dashboard/config/${selectedGreenhouseId}/${idArea}`);
  };
  const handleOpenedAddConfig = (x: boolean, y: boolean) => {
    setIsHistoryOpen(y);
    setIsAddConfigOpen(x);
    setSelectedData(null);
  };

  const handleToggleActuator = (
    deviceId: string,
    macAddress: string,
    component: any,
    currentState: boolean,
  ) => {
    const newState = !currentState;
    const componentKey = component.id;

    setRealtimeData((prev) => ({
      ...prev,
      [macAddress]: {
        ...prev[macAddress],
        [componentKey]: newState ? "ON" : "OFF",
      },
    }));

    toggleMutation.mutate(
      {
        deviceId: deviceId,
        componentId: component.id,
        command: newState,
      },
      {
        onError: (err: any) => {
          toast.error(err.message || "Gagal mengontrol perangkat");
          setRealtimeData((prev) => ({
            ...prev,
            [macAddress]: {
              ...prev[macAddress],
              [componentKey]: currentState ? "ON" : "OFF",
            },
          }));
        },
      },
    );
  };

  const handleSubmitForm = (data: DeviceFormType) => {
    if (selectedData) {
      console.log("cek ini selectedData", selectedData);
      updateMutation.mutate(
        {id: selectedData.id, idGreenhouse: selectedGreenhouseId, ...data},
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Config updated successfully");
            handleOpenedAddConfig([], false, true);
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
            toast.success(res.message || "Config created successfully");
            handleOpenedAddConfig([], false, true);
          },
          onError: (err: any) => toast.error(err.message),
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
              router.push(`/dashboard/device/${selectedGreenhouseId}/${row.id}`)
            }
            variant="ghost"
            className="p-2 text-blue-600 hover:bg-blue-50"
            title="View Detail"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            // onClick={() => handleOpenEdit(row)}
            variant="ghost"
            className="p-2 text-blue-600 hover:bg-blue-50"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            // onClick={() => handleDelete(row.id)}
            variant="ghost"
            className="p-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const getAreaActuator = useMemo(() => {
    const areaSpesific = areas.data?.find((area) => {
      return area.id === selectedAreaId;
    });
    return (
      areaSpesific?.devices?.filter(
        (d: any) =>
          !d.components?.some((c: any) => c.type === "SENSOR") &&
          d.components?.some((c: any) => c.type === "ACTUATOR"),
      ) || []
    );
  }, [areas.data, selectedAreaId]);
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

  const activeDevice = getAreaActuator.find(
    (d: any) => d.id === selectedDeviceIdInForm,
  );

  // console.log("area saat ini", selectedDeviceIdInForm);

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
        placeholder: "Contoh: 10",
      },
    ],
    [deviceConfig, componentsConfig, selectedDeviceIdInForm],
  );

  // 🔥 FUNGSI BARU: Logika penentu status berdasarkan selisih waktu
  const getDeviceStatus = (macAddress: string) => {
    const lastTime = lastSeen[macAddress];
    if (!lastTime) return "OFFLINE"; // Kalau belum pernah ngirim data sama sekali sejak halaman dibuka

    const diffInSeconds = (now - lastTime) / 1000;
    if (diffInSeconds <= 15) return "ONLINE";
    if (diffInSeconds <= 60) return "DELAY";
    return "OFFLINE";
  };

  // --- KOMPONEN KARTU DEVICE ---
  const renderDeviceCard = (device: any) => {
    const liveData = realtimeData[device.macAddress] || {};
    const sensors =
      device.components?.filter((c: any) => c.type === "SENSOR") || [];
    const actuators =
      device.components?.filter((c: any) => c.type === "ACTUATOR") || [];

    // Ambil statusnya
    const status = getDeviceStatus(device.macAddress);

    return (
      <div
        key={device.id}
        className={`mb-5 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
          status === "OFFLINE"
            ? "border-gray-200 opacity-80"
            : "border-green-100"
        }`}
      >
        {/* Header Device */}
        <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${status === "ONLINE" ? "bg-green-100 text-green-600" : status === "DELAY" ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-500"}`}
            >
              <Cpu className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900">
                  {device.name}
                </h4>

                {/* 🔥 BADGE STATUS 🔥 */}
                {status === "ONLINE" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 border border-green-200">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inline-flex w-full h-full bg-green-500 rounded-full opacity-75 animate-ping"></span>
                      <span className="relative inline-flex w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    </span>
                    Online
                  </span>
                )}
                {status === "DELAY" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-medium text-yellow-700 border border-yellow-200">
                    <Clock className="w-3 h-3 text-yellow-500" /> Delay
                  </span>
                )}
                {status === "OFFLINE" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-200">
                    <WifiOff className="w-3 h-3 text-gray-400" /> Offline
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-mono tracking-tight mt-0.5">
                {device.macAddress}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                router.push(
                  `/dashboard/device/${selectedGreenhouseId}/${device.id}`,
                )
              }
              className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Detail
            </button>
            <div className="w-px h-3 bg-gray-200 mx-1" />{" "}
            {/* Separator kecil */}
            <button
              onClick={() => handleViewHistory(device.id)}
              className="text-xs flex items-center gap-1 text-gray-500 hover:text-green-600 font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
            >
              <History className="w-3.5 h-3.5" /> Riwayat
            </button>
          </div>
        </div>

        {/* Body Device (Flexible Split Layout) */}
        <div className="p-4 flex flex-col md:flex-row gap-6">
          {/* BAGIAN KIRI: SENSOR */}
          {sensors.length > 0 && (
            <div
              className={`flex-1 space-y-3 ${actuators.length > 0 ? "md:border-r md:border-gray-100 md:pr-6" : ""}`}
            >
              {sensors.map((sensor: any) => {
                const rawValue = liveData[sensor.id];
                const displayValue = rawValue !== undefined ? rawValue : "--";

                const isTemp =
                  sensor.name.toLowerCase().includes("suhu") ||
                  sensor.name.toLowerCase().includes("temp");
                const isHumid =
                  sensor.name.toLowerCase().includes("lembab") ||
                  sensor.name.toLowerCase().includes("humid");

                return (
                  <div
                    key={sensor.id}
                    className="flex justify-between items-center bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-2.5">
                      {isTemp ? (
                        <Thermometer
                          className={`w-4 h-4 ${status === "OFFLINE" ? "text-gray-400" : "text-orange-500"}`}
                        />
                      ) : isHumid ? (
                        <Droplets
                          className={`w-4 h-4 ${status === "OFFLINE" ? "text-gray-400" : "text-blue-500"}`}
                        />
                      ) : (
                        <Activity
                          className={`w-4 h-4 ${status === "OFFLINE" ? "text-gray-400" : "text-green-500"}`}
                        />
                      )}
                      <span
                        className={`text-sm font-medium ${status === "OFFLINE" ? "text-gray-500" : "text-gray-700"}`}
                      >
                        {sensor.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-base font-bold ${status === "OFFLINE" ? "text-gray-500" : "text-gray-900"}`}
                      >
                        {displayValue}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        {sensor.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BAGIAN KANAN: ACTUATOR */}
          {actuators.length > 0 && (
            <div
              className={`flex-1 space-y-3 ${sensors.length === 0 ? "md:ml-auto md:max-w-[50%]" : "flex flex-col justify-center"}`}
            >
              {actuators.map((actuator: any) => {
                const rawValue = liveData[actuator.id];
                const isOn =
                  rawValue === "ON" || rawValue === 1 || rawValue === true;

                return (
                  <div
                    key={actuator.id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${status === "OFFLINE" ? "bg-gray-50 border-gray-200" : "bg-orange-50/30 border-orange-100/50"}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Fan
                        className={`w-4 h-4 ${isOn && status !== "OFFLINE" ? "text-green-500 animate-spin-slow" : "text-gray-400"}`}
                      />
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-medium ${status === "OFFLINE" ? "text-gray-500" : "text-gray-800"}`}
                        >
                          {actuator.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${isOn && status !== "OFFLINE" ? "text-green-600" : "text-gray-400"}`}
                        >
                          {isOn ? "Menyala" : "Mati"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleToggleActuator(
                          device.id,
                          device.macAddress,
                          actuator,
                          isOn,
                        )
                      }
                      disabled={
                        toggleMutation.isPending || status === "OFFLINE"
                      } // Disable kalau alatnya mati!
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        isOn && status !== "OFFLINE"
                          ? "bg-green-500"
                          : "bg-gray-200"
                      } ${toggleMutation.isPending || status === "OFFLINE" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOn && status !== "OFFLINE" ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {sensors.length === 0 && actuators.length === 0 && (
            <div className="w-full py-6 flex flex-col items-center justify-center text-gray-400">
              <Cpu className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm italic">
                Belum ada komponen terpasang di Node ini.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8 bg-gray-50/30 min-h-screen pb-10">
      {/* Page Header (Sama seperti sebelumnya) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard Real-time
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoring dan kontrol greenhouse berbasis MQTT.
          </p>
        </div>
        <div className="w-full md:w-64">
          <select
            value={selectedGreenhouseId}
            onChange={(e) => setSelectedGreenhouseId(e.target.value)}
            disabled={isLoadingGreenhouse}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm cursor-pointer"
          >
            {greenhouses.data?.map((gh: GreenhousesType) => (
              <option key={gh.id} value={gh.id}>
                {gh.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      {isLoadingAreas ? (
        <div className="flex flex-col justify-center items-center h-64 text-green-600">
          <Activity className="w-8 h-8 animate-pulse mb-3" />
          <p className="font-medium text-gray-500">Memuat data area...</p>
        </div>
      ) : (
        <motion.div
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          className="space-y-10"
        >
          {areas.data?.map((area: any) => {
            const devicesWithSensors =
              area.devices?.filter((d: any) =>
                d.components?.some((c: any) => c.type === "SENSOR"),
              ) || [];
            const devicesPureActuators =
              area.devices?.filter(
                (d: any) =>
                  !d.components?.some((c: any) => c.type === "SENSOR") &&
                  d.components?.some((c: any) => c.type === "ACTUATOR"),
              ) || [];

            return (
              <div
                key={area.id}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                  <div className="bg-green-100 p-2.5 rounded-xl text-green-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {area.name}
                  </h2>
                  <div className="ms-auto">
                    <Button onClick={() => handleOpenedHistory(area.id)}>
                      <Settings />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Thermometer className="w-4 h-4" /> Node Sensor
                    </h3>
                    {devicesWithSensors.length > 0 ? (
                      devicesWithSensors.map(renderDeviceCard)
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-300">
                        <p className="text-gray-400 text-sm">
                          Tidak ada node sensor terdaftar di area ini.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Fan className="w-4 h-4" /> Node Aktuator
                    </h3>
                    {devicesPureActuators.length > 0 ? (
                      devicesPureActuators.map(renderDeviceCard)
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-300">
                        <p className="text-gray-400 text-sm">
                          Tidak ada node khusus aktuator di area ini.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {isHistoryOpen ? (
                    <motion.div
                      key="history-modal" // Key sangat penting untuk mode="wait"
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      exit={{opacity: 0}}
                    >
                      <motion.div
                        initial={{opacity: 0, scale: 0.95, y: 20}}
                        animate={{opacity: 1, scale: 1, y: 0}}
                        exit={{opacity: 0, scale: 0.95, y: 20}}
                        transition={{duration: 0.2}}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                      >
                        {/* Header List */}
                        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
                          <h3 className="font-bold text-gray-800">
                            Automation Config
                          </h3>
                          <button
                            onClick={() => handleOpenedHistory(false, "")}
                            className="text-gray-400"
                          >
                            <Plus className="w-6 h-6 rotate-45" />
                          </button>
                        </div>

                        {/* Content List */}
                        <div className="p-6">
                          <div className="max-h-[400px] overflow-y-auto rounded-xl border border-gray-100">
                            <Table
                              columns={columns}
                              data={automationConfig.data || []}
                              isLoading={isLoadingConfig}
                            />
                          </div>
                        </div>

                        {/* Footer List */}
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-2">
                          <Button
                            variant="primary"
                            onClick={() => handleOpenedAddConfig(true, false)} // Ini akan men-trigger exit modal ini dulu
                          >
                            Add Config
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenedHistory(false, "")}
                          >
                            Close
                          </Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : isAddConfigOpen ? (
                    <motion.div
                      key="add-config-modal" // Key unik agar framer tahu ini komponen berbeda
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      exit={{opacity: 0}}
                    >
                      <motion.div
                        initial={{opacity: 0, scale: 0.95, y: 20}}
                        animate={{opacity: 1, scale: 1, y: 0}}
                        exit={{opacity: 0, scale: 0.95, y: 20}}
                        transition={{duration: 0.2}}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                      >
                        {/* Header Add */}
                        <GenericFormModal
                          isOpen={isAddConfigOpen}
                          onClose={() => handleOpenedAddConfig(false, true)}
                          title={selectedData ? "Edit Device" : "Add Device"}
                          schema={ConfigSchema}
                          fields={ConfigField}
                          defaultValues={
                            selectedData
                              ? {
                                  deviceId: selectedData.deviceId,
                                  componentId: selectedData.componentId,
                                  action: selectedData.action,
                                  time: selectedData.time,
                                  // Pastikan duration di-parse ke number jika dari API datang sebagai string
                                  duration: selectedData.duration,
                                }
                              : {
                                  deviceId: "",
                                  componentId: "",
                                  action: "", // atau default "ON"
                                  time: "00:00",
                                  duration: "",
                                }
                          }
                          onSubmit={handleSubmitForm}
                          isLoading={isPending}
                          submitText={selectedData ? "Save Changes" : "Create"}
                        />
                      </motion.div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
