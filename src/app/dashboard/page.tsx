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
  Thermometer,
  Droplets,
  MapPin,
  WifiOff,
  Clock,
  Eye,
  Settings,
  Plus,
  Edit,
  Trash2,
  Sun,
  Gauge,
  Power,
  Flame,
  Waves,
  Wind,
  Layers,
  Zap,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import mqtt from "mqtt";
import {useToggleActuator} from "@/src/hooks/use-deviceComponents";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import Button from "@/src/components/ui/button";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {
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

// Helper: Visual styling for any dynamic sensor
function getSensorVisuals(name: string = "", category: string = "") {
  const text = `${name} ${category}`.toLowerCase();
  if (text.includes("suhu") || text.includes("temp")) {
    return {
      icon: Thermometer,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-500/10",
      label: "Suhu",
    };
  }
  if (
    text.includes("lembab") ||
    text.includes("humid") ||
    text.includes("moist") ||
    text.includes("air") ||
    text.includes("water")
  ) {
    return {
      icon: Droplets,
      iconColor: "text-sky-500",
      bgColor: "bg-sky-500/10",
      label: "Kelembaban / Air",
    };
  }
  if (
    text.includes("cahaya") ||
    text.includes("lux") ||
    text.includes("light") ||
    text.includes("ldr") ||
    text.includes("solar")
  ) {
    return {
      icon: Sun,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
      label: "Cahaya",
    };
  }
  if (
    text.includes("ph") ||
    text.includes("ec") ||
    text.includes("tds") ||
    text.includes("nutrisi") ||
    text.includes("ppm")
  ) {
    return {
      icon: Waves,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      label: "Nutrisi / Kualitas",
    };
  }
  if (
    text.includes("tekanan") ||
    text.includes("press") ||
    text.includes("bar") ||
    text.includes("hpa")
  ) {
    return {
      icon: Gauge,
      iconColor: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      label: "Tekanan",
    };
  }
  return {
    icon: Activity,
    iconColor: "text-teal-500",
    bgColor: "bg-teal-500/10",
    label: "Telemetri",
  };
}

// Helper: Visual styling for any dynamic actuator
function getActuatorVisuals(name: string = "", category: string = "") {
  const text = `${name} ${category}`.toLowerCase();
  if (text.includes("kipas") || text.includes("fan") || text.includes("blower")) {
    return {
      icon: Wind,
      spinOnActive: true,
      categoryLabel: "Sirkulasi Udara",
    };
  }
  if (
    text.includes("pompa") ||
    text.includes("pump") ||
    text.includes("siram") ||
    text.includes("valve") ||
    text.includes("kran") ||
    text.includes("mist") ||
    text.includes("spray")
  ) {
    return {
      icon: Droplets,
      spinOnActive: false,
      categoryLabel: "Irigasi & Nutrisi",
    };
  }
  if (
    text.includes("lampu") ||
    text.includes("light") ||
    text.includes("led") ||
    text.includes("grow")
  ) {
    return {
      icon: Sun,
      spinOnActive: false,
      categoryLabel: "Pencahayaan",
    };
  }
  if (text.includes("heater") || text.includes("pemanas") || text.includes("suhu")) {
    return {
      icon: Flame,
      spinOnActive: false,
      categoryLabel: "Pemanas",
    };
  }
  return {
    icon: Power,
    spinOnActive: false,
    categoryLabel: "Relay Aktuator",
  };
}

// Sub-component: Modular Device Card
function DeviceCard({
  device,
  liveData,
  lastSeenTime,
  selectedGreenhouseId,
  onToggleActuator,
  isToggling,
  filterMode,
}: {
  device: any;
  liveData: any;
  lastSeenTime?: number;
  selectedGreenhouseId: string;
  onToggleActuator: (
    deviceId: string,
    macAddress: string,
    component: any,
    currentState: boolean,
  ) => void;
  isToggling: boolean;
  filterMode: "ALL" | "SENSORS" | "ACTUATORS";
}) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const getDeviceStatus = () => {
    if (!lastSeenTime) return "OFFLINE";
    const diffInSeconds = (currentTime - lastSeenTime) / 1000;
    if (diffInSeconds <= 20) return "ONLINE";
    if (diffInSeconds <= 60) return "DELAY";
    return "OFFLINE";
  };

  const status = getDeviceStatus();
  const sensors =
    device.components?.filter((c: any) => c.type === "SENSOR") || [];
  const actuators =
    device.components?.filter((c: any) => c.type === "ACTUATOR") || [];

  const shouldShowSensors =
    sensors.length > 0 && (filterMode === "ALL" || filterMode === "SENSORS");
  const shouldShowActuators =
    actuators.length > 0 && (filterMode === "ALL" || filterMode === "ACTUATORS");

  if (!shouldShowSensors && !shouldShowActuators && filterMode !== "ALL") {
    return null;
  }

  return (
    <motion.div
      initial={{opacity: 0, y: 15}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.3}}
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col ${
        status === "ONLINE"
          ? "border-emerald-100 shadow-sm hover:shadow-md ring-1 ring-emerald-500/5"
          : status === "DELAY"
            ? "border-amber-100 shadow-sm hover:shadow-md"
            : "border-gray-200/80 shadow-xs opacity-90"
      }`}
    >
      {/* 1. Device Card Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/40 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`p-2.5 rounded-xl transition-all ${
              status === "ONLINE"
                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60 shadow-xs"
                : status === "DELAY"
                  ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200/60"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            <Cpu className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900 tracking-tight truncate">
                {device.name}
              </h4>

              {/* Status Badge */}
              {status === "ONLINE" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex w-full h-full bg-emerald-400 rounded-full opacity-75 animate-ping" />
                    <span className="relative inline-flex w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  </span>
                  ONLINE
                </span>
              )}
              {status === "DELAY" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-500 animate-spin-slow" />
                  DELAY
                </span>
              )}
              {status === "OFFLINE" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-500 border border-gray-200">
                  <WifiOff className="w-3 h-3 text-gray-400" />
                  OFFLINE
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-400 font-mono tracking-tight mt-0.5 flex items-center gap-2">
              <span>{device.macAddress}</span>
              {device.lastSeen && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-[10px] text-gray-400 font-sans">
                    Seen:{" "}
                    {new Date(device.lastSeen).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() =>
              router.push(
                `/dashboard/device/${selectedGreenhouseId}/${device.id}`,
              )
            }
            className="text-xs font-semibold flex items-center gap-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-gray-200/80 bg-white shadow-2xs transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" /> Detail Node
          </Button>
        </div>
      </div>

      {/* 2. Device Card Body */}
      <div className="p-5 space-y-5 flex-1 flex flex-col justify-between">
        {/* SENSORS SECTION (Dynamic Auto-fit Grid) */}
        {shouldShowSensors && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Live
                Sensors ({sensors.length})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
              {sensors.map((sensor: any) => {
                const visual = getSensorVisuals(sensor.name, sensor.category);
                const IconComponent = visual.icon;
                const rawValue = liveData?.[sensor.id];
                const hasValue = rawValue !== undefined && rawValue !== null;

                const formattedValue = hasValue
                  ? typeof rawValue === "number" || !isNaN(Number(rawValue))
                    ? Number(rawValue).toFixed(
                        sensor.name?.toLowerCase().includes("ph") ||
                          sensor.category?.toLowerCase().includes("ph")
                          ? 2
                          : 1,
                      )
                    : rawValue
                  : "--";

                return (
                  <div
                    key={sensor.id}
                    className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                      status === "OFFLINE"
                        ? "bg-gray-50/60 border-gray-200/70"
                        : "bg-white border-gray-100 hover:border-emerald-200 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            status === "OFFLINE"
                              ? "bg-gray-100 text-gray-400"
                              : `${visual.bgColor} ${visual.iconColor}`
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {sensor.name}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {sensor.category || visual.label}
                          </p>
                        </div>
                      </div>

                      {hasValue && status === "ONLINE" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 mt-1" />
                      )}
                    </div>

                    <div className="flex items-baseline justify-between mt-1 pt-2 border-t border-gray-50">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Nilai
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-lg font-black font-mono tracking-tight ${
                            status === "OFFLINE"
                              ? "text-gray-400"
                              : "text-gray-900"
                          }`}
                        >
                          {formattedValue}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500 uppercase">
                          {sensor.unit || ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTUATORS SECTION (Smart Interactive Switch Tiles) */}
        {shouldShowActuators && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Power className="w-3.5 h-3.5 text-emerald-500" /> Smart Controls
                ({actuators.length})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {actuators.map((actuator: any) => {
                const visual = getActuatorVisuals(
                  actuator.name,
                  actuator.category,
                );
                const IconComponent = visual.icon;
                const rawValue = liveData?.[actuator.id];
                const isOn =
                  rawValue === "ON" || rawValue === 1 || rawValue === true;
                const isOnline = status !== "OFFLINE";

                return (
                  <div
                    key={actuator.id}
                    onClick={() => {
                      if (isOnline && !isToggling) {
                        onToggleActuator(
                          device.id,
                          device.macAddress,
                          actuator,
                          isOn,
                        );
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 select-none cursor-pointer ${
                      isOn && isOnline
                        ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-emerald-300/80 ring-1 ring-emerald-300/40 shadow-xs"
                        : isOnline
                          ? "bg-white border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/50"
                          : "bg-gray-50/60 border-gray-200/60 opacity-70 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl transition-transform duration-300 shrink-0 ${
                          isOn && isOnline
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 scale-105"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <IconComponent
                          className={`w-4 h-4 ${
                            isOn && isOnline && visual.spinOnActive
                              ? "animate-spin-slow"
                              : ""
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {actuator.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                              isOn && isOnline
                                ? "bg-emerald-100/80 text-emerald-700"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {isOn && isOnline ? "● ON" : "○ OFF"}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate">
                            {actuator.category || visual.categoryLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Switch Toggle Button */}
                    <button
                      type="button"
                      disabled={!isOnline || isToggling}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleActuator(
                          device.id,
                          device.macAddress,
                          actuator,
                          isOn,
                        );
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isOn && isOnline
                          ? "bg-emerald-500 shadow-sm shadow-emerald-500/25"
                          : "bg-gray-200"
                      } ${!isOnline || isToggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          isOn && isOnline ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty Components Node State */}
        {sensors.length === 0 && actuators.length === 0 && (
          <div className="py-6 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <Cpu className="w-8 h-8 mb-2 opacity-40 text-gray-400" />
            <p className="text-xs font-medium text-gray-500">
              Belum ada komponen terpasang di Node ini.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

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
  const [lastSeen, setLastSeen] = useState<{[mac: string]: number}>({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddConfigOpen, setIsAddConfigOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<"ALL" | "SENSORS" | "ACTUATORS">(
    "ALL",
  );

  const {data: greenhouses, isLoading: isLoadingGreenhouse} =
    useGetMyGreenhouses();
  const {data: areas, isLoading: isLoadingAreas} =
    useGetGreenhouseAreas(selectedGreenhouseId);

  const {data: automationConfig, isLoading: isLoadingConfig} =
    useGetGreenhouseAreasAutomation(selectedGreenhouseId, selectedAreaId);

  const greenhouseList: GreenhousesType[] =
    (greenhouses as any)?.data ||
    (Array.isArray(greenhouses) ? greenhouses : []);
  const areaList: any[] =
    (areas as any)?.data || (Array.isArray(areas) ? areas : []);
  const automationList: any[] =
    (automationConfig as any)?.data ||
    (Array.isArray(automationConfig) ? automationConfig : []);

  const toggleMutation = useToggleActuator();
  const createMutation = useCreateAutomation();
  const updateMutation = useUpdateAutomation();

  // MQTT Real-time Stream
  useEffect(() => {
    const client = mqtt.connect("wss://urken.psti-ubl.id/ws-rabbitmq", {
      username: "/smk2pkl:smk2iot",
      password: "smk2iot",
      clientId: `nextjs_${Math.random().toString(16).slice(3)}`,
      protocolId: "MQTT",
    });

    client.on("connect", () => {
      client.subscribe("sensor/#");
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
    if (greenhouseList.length > 0 && selectedGreenhouseId === "") {
      setSelectedGreenhouseId(greenhouseList[0].id);
    }
  }, [greenhouseList, selectedGreenhouseId]);

  // Hardware-Agnostic Top Overview Aggregator
  const greenhouseStats = useMemo(() => {
    let totalDevices = 0;
    let onlineDevices = 0;
    let totalSensors = 0;
    let activeStreamSensors = 0;
    let totalActuators = 0;
    let activeActuatorsCount = 0;

    // Dynamically group active sensor readings by category/name
    const categoryMap: {
      [cat: string]: {values: number[]; unit: string; label: string};
    } = {};

    const now = Date.now();

    areaList.forEach((area: any) => {
      (area.devices || []).forEach((dev: any) => {
        totalDevices += 1;
        const lastSeenTime = lastSeen[dev.macAddress];
        const isOnline = lastSeenTime && (now - lastSeenTime) / 1000 <= 60;
        if (isOnline) {
          onlineDevices += 1;
        }

        const devRealtime = realtimeData[dev.macAddress] || {};

        (dev.components || []).forEach((comp: any) => {
          if (comp.type === "SENSOR") {
            totalSensors += 1;
            const rawVal = devRealtime[comp.id];
            if (rawVal !== undefined && rawVal !== null) {
              activeStreamSensors += 1;
              const numVal = Number(rawVal);
              if (!isNaN(numVal)) {
                const groupKey = (
                  comp.category ||
                  comp.name ||
                  "Sensor"
                ).trim();
                if (!categoryMap[groupKey]) {
                  categoryMap[groupKey] = {
                    values: [],
                    unit: comp.unit || "",
                    label: comp.category || comp.name || "Sensor",
                  };
                }
                categoryMap[groupKey].values.push(numVal);
              }
            }
          } else if (comp.type === "ACTUATOR") {
            totalActuators += 1;
            const val = devRealtime[comp.id];
            if (val === "ON" || val === 1 || val === true) {
              activeActuatorsCount += 1;
            }
          }
        });
      });
    });

    const dynamicCategoryStats = Object.values(categoryMap).map((cat) => {
      const avg = cat.values.reduce((a, b) => a + b, 0) / cat.values.length;
      return {
        label: cat.label,
        value: avg % 1 === 0 ? avg.toString() : avg.toFixed(1),
        unit: cat.unit,
      };
    });

    const onlinePercentage =
      totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

    return {
      totalDevices,
      onlineDevices,
      onlinePercentage,
      totalSensors,
      activeStreamSensors,
      totalActuators,
      activeActuatorsCount,
      dynamicCategoryStats,
    };
  }, [areaList, lastSeen, realtimeData]);

  const handleOpenAreaConfigModal = (idArea: string) => {
    setSelectedAreaId(idArea);
    setIsHistoryOpen(true);
  };

  const handleCloseHistory = () => {
    setIsHistoryOpen(false);
  };

  const handleOpenAddConfig = () => {
    setIsHistoryOpen(false);
    setIsAddConfigOpen(true);
    setSelectedData(null);
  };

  const handleCloseAddConfig = () => {
    setIsAddConfigOpen(false);
    setIsHistoryOpen(true);
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

  const handleSubmitForm = (data: ConfigFormType) => {
    if (selectedData) {
      updateMutation.mutate(
        {id: selectedData.id, idGreenhouse: selectedGreenhouseId, ...data},
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Config updated successfully");
            setIsAddConfigOpen(false);
            setIsHistoryOpen(true);
            setSelectedData(null);
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
            setIsAddConfigOpen(false);
            setIsHistoryOpen(true);
            setSelectedData(null);
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
          {row.device?.name || "-"}
        </span>
      ),
    },
    {
      header: "Component",
      cell: (row) => (
        <span className="text-[10px] text-gray-400 font-bold uppercase">
          {row.component?.name || "-"}
        </span>
      ),
    },
    {header: "Time", accessor: "time"},
    {header: "Duration", accessor: "duration"},
    {
      header: "Status",
      cell: (row) => {
        const actionConfig = row.action;
        return actionConfig === "OFF" ? (
          <Badge color="red">{actionConfig}</Badge>
        ) : (
          <Badge color="green">{actionConfig}</Badge>
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
            variant="ghost"
            className="p-2 text-blue-600 hover:bg-blue-50"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
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
    const areaSpecific = areaList.find(
      (area: any) => area.id === selectedAreaId,
    );
    return (
      areaSpecific?.devices?.filter(
        (d: any) =>
          !d.components?.some((c: any) => c.type === "SENSOR") &&
          d.components?.some((c: any) => c.type === "ACTUATOR"),
      ) || []
    );
  }, [areaList, selectedAreaId]);

  const deviceConfig = useMemo(
    () =>
      getAreaActuator.map((device: any) => ({
        label: device.name,
        value: device.id,
      })),
    [getAreaActuator],
  );

  const componentsConfig = useMemo(() => {
    const activeDevice = getAreaActuator.find(
      (d: any) => d.id === selectedDeviceIdInForm,
    );
    return (
      activeDevice?.components?.map((component: any) => ({
        label: component.name,
        value: component.id,
      })) || []
    );
  }, [getAreaActuator, selectedDeviceIdInForm]);

  const ConfigField: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "deviceId",
        label: "Device",
        type: "select",
        placeholder: "Pilih Device...",
        options: deviceConfig,
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
        type: "select",
        placeholder: "Pilih aksi...",
        options: [
          {label: "Turn On", value: "ON"},
          {label: "Turn Off", value: "OFF"},
        ],
      },
      {
        name: "time",
        label: "Execution Time",
        type: "time",
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

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8 bg-gray-50/40 min-h-screen pb-16">
      {/* 1. Header & Greenhouse Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-5 bg-white/70 backdrop-blur-md sticky top-0 z-20 px-1 pt-1">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs shadow-emerald-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Smart Greenhouse Dashboard
              </h1>
              <p className="text-xs text-gray-500">
                Live telemetry & automated actuator controller
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Filter Component Tabs */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 text-xs font-bold text-gray-600 shadow-2xs">
            <button
              onClick={() => setFilterMode("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === "ALL"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "hover:text-gray-900"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterMode("SENSORS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === "SENSORS"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "hover:text-gray-900"
              }`}
            >
              Sensors
            </button>
            <button
              onClick={() => setFilterMode("ACTUATORS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === "ACTUATORS"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "hover:text-gray-900"
              }`}
            >
              Aktuator
            </button>
          </div>

          {/* Greenhouse Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedGreenhouseId}
              onChange={(e) => setSelectedGreenhouseId(e.target.value)}
              disabled={isLoadingGreenhouse}
              className="w-full px-3.5 py-2 bg-white border border-gray-300/80 rounded-xl text-xs font-bold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
            >
              {greenhouseList.map((gh: GreenhousesType) => (
                <option key={gh.id} value={gh.id}>
                  🏡 {gh.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top Executive KPI Summary Cards (100% Hardware-Agnostic) */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Node Status */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:border-emerald-200 transition-all">
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 group-hover:scale-105 transition-transform shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Hardware Nodes
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-gray-900 font-mono">
                  {greenhouseStats.onlineDevices}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  / {greenhouseStats.totalDevices} Online
                </span>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                {greenhouseStats.onlinePercentage}% Terkoneksi
              </p>
            </div>
          </div>

          {/* Card 2: Total Sensors Telemetry */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:border-sky-200 transition-all">
            <div className="p-3.5 rounded-2xl bg-sky-50 text-sky-500 ring-1 ring-sky-100 group-hover:scale-105 transition-transform shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Sensor Telemetri
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-gray-900 font-mono">
                  {greenhouseStats.totalSensors}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  Terpasang
                </span>
              </div>
              <p className="text-[10px] text-sky-600 font-bold mt-0.5">
                {greenhouseStats.activeStreamSensors} Streaming Aktif
              </p>
            </div>
          </div>

          {/* Card 3: Actuators Control */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:border-amber-200 transition-all">
            <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-100 group-hover:scale-105 transition-transform shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Kontrol Aktuator
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-amber-600 font-mono">
                  {greenhouseStats.activeActuatorsCount}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  / {greenhouseStats.totalActuators} ON
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                {greenhouseStats.activeActuatorsCount > 0
                  ? `${greenhouseStats.activeActuatorsCount} alat bekerja`
                  : "Semua standby"}
              </p>
            </div>
          </div>

          {/* Card 4: Areas / Zones */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:border-indigo-200 transition-all">
            <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100 group-hover:scale-105 transition-transform shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Zona / Area
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-gray-900 font-mono">
                  {areaList.length}
                </span>
                <span className="text-xs text-gray-400 font-medium">Zona</span>
              </div>
              <p className="text-[10px] text-indigo-600 font-bold mt-0.5">
                Distribusi Manajemen
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Pill Strip (Hanya tampil jika ada sensor live yang terdeteksi secara dinamis) */}
        {greenhouseStats.dynamicCategoryStats.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest shrink-0 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetri:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {greenhouseStats.dynamicCategoryStats.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border border-gray-200/70 text-xs shadow-2xs shrink-0 hover:border-emerald-300 transition-all"
                >
                  <span className="text-gray-500 font-medium text-[11px]">
                    {item.label}:
                  </span>
                  <span className="font-black text-gray-900 font-mono text-xs">
                    {item.value}
                  </span>
                  {item.unit && (
                    <span className="text-[9px] text-gray-400 uppercase font-bold">
                      {item.unit}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Area Grid */}
      {isLoadingAreas ? (
        <div className="flex flex-col justify-center items-center h-64 text-emerald-600">
          <Activity className="w-8 h-8 animate-pulse mb-3" />
          <p className="font-medium text-gray-500 text-sm">
            Memuat data zona & perangkat...
          </p>
        </div>
      ) : areaList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300 max-w-md mx-auto my-10">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-base">Belum Ada Area</h3>
          <p className="text-xs text-gray-500 mt-1">
            Tambahkan area/zona di greenhouse ini untuk mulai memonitor perangkat.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          className="space-y-10"
        >
          {areaList.map((area: any) => {
            const devices = area.devices || [];

            return (
              <div
                key={area.id}
                className="bg-white/90 rounded-3xl p-6 md:p-8 shadow-xs border border-gray-200/80 space-y-6"
              >
                {/* Area Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 text-white p-2.5 rounded-2xl shadow-xs shadow-emerald-500/20">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                        {area.name}
                      </h2>
                      <p className="text-xs text-gray-400 font-medium">
                        {devices.length} Node terpasang di zona ini
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleOpenAreaConfigModal(area.id)}
                      className="border border-gray-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-emerald-600" />
                      Jadwal Otomasi
                    </Button>
                  </div>
                </div>

                {/* Device Cards inside Area */}
                {devices.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {devices.map((device: any) => (
                      <DeviceCard
                        key={device.id}
                        device={device}
                        liveData={realtimeData[device.macAddress]}
                        lastSeenTime={lastSeen[device.macAddress]}
                        selectedGreenhouseId={selectedGreenhouseId}
                        onToggleActuator={handleToggleActuator}
                        isToggling={toggleMutation.isPending}
                        filterMode={filterMode}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50/70 rounded-2xl p-8 text-center border border-dashed border-gray-200">
                    <Cpu className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-500">
                      Belum ada node perangkat di area ini.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}

      {/* 4. Automation Config Modals */}
      <AnimatePresence mode="wait">
        {isHistoryOpen ? (
          <motion.div
            key="history-modal"
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100"
            >
              {/* Header List */}
              <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm">
                    Konfigurasi Otomasi Jadwal
                  </h3>
                </div>
                <button
                  onClick={handleCloseHistory}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Content List */}
              <div className="p-6">
                <div className="max-h-[380px] overflow-y-auto rounded-2xl border border-gray-100">
                  <Table
                    columns={columns}
                    data={automationList}
                    isLoading={isLoadingConfig}
                  />
                </div>
              </div>

              {/* Footer List */}
              <div className="px-6 py-4 bg-gray-50/60 border-t flex justify-end gap-2">
                <Button
                  variant="primary"
                  onClick={handleOpenAddConfig}
                  className="rounded-xl text-xs font-bold px-4"
                >
                  + Tambah Jadwal Otomasi
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCloseHistory}
                  className="rounded-xl text-xs font-bold"
                >
                  Tutup
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : isAddConfigOpen ? (
          <motion.div
            key="add-config-modal"
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <GenericFormModal
                isOpen={isAddConfigOpen}
                onClose={handleCloseAddConfig}
                title={selectedData ? "Edit Automation" : "Add Automation"}
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
                        action: "ON",
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
}
