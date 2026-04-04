/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {useGetGreenhouseAreas} from "@/src/hooks/use-area";
import {useGetMyGreenhouses} from "@/src/hooks/use-greenhouses";
import {GreenhousesType} from "@/src/types";
import {motion} from "framer-motion";
import {useEffect, useState} from "react";
import {
  Activity,
  Cpu,
  Fan,
  History,
  Thermometer,
  Droplets,
  MapPin,
} from "lucide-react";
import mqtt from "mqtt";
import {useToggleActuator} from "@/src/hooks/use-deviceComponents";
import {toast} from "sonner";

export default function DashboardPage() {
  const [selectedGreenhouseId, setSelectedGreenhouseId] = useState<string>("");
  const [realtimeData, setRealtimeData] = useState<{[mac: string]: any}>({});

  const {data: greenhouses = [], isLoading: isLoadingGreenhouse} =
    useGetMyGreenhouses();
  const {data: areas = [], isLoading: isLoadingAreas} =
    useGetGreenhouseAreas(selectedGreenhouseId);
  const toggleMutation = useToggleActuator();

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
        console.log("Topic masuk:", topic);
        const data = JSON.parse(message.toString());
        console.log("Data masuk:", data);
        const macAddress = topic.split("/")[1] || topic;

        setRealtimeData((prev) => ({
          ...prev,
          [macAddress]: {
            ...prev[macAddress],
            ...data,
          },
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
    console.log("Buka riwayat untuk device:", deviceId);
    toast.info("Fitur riwayat sedang dalam pengembangan");
  };

  const handleToggleActuator = (
    deviceId: string,
    macAddress: string,
    component: any,
    currentState: boolean,
  ) => {
    const newState = !currentState;
    const componentKey = component.id;

    // Optimistic UI
    setRealtimeData((prev) => ({
      ...prev,
      [macAddress]: {
        ...prev[macAddress],
        [componentKey]: newState ? "ON" : "OFF",
      },
    }));

    // Tembak API
    toggleMutation.mutate(
      {
        deviceId: deviceId,
        componentId: component.id,
        command: newState, // Disesuaikan dengan backend Zod (command, bukan data)
      },
      {
        onError: (err: any) => {
          toast.error(err.message || "Gagal mengontrol perangkat");
          // Rollback jika gagal
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

  // --- KOMPONEN KARTU DEVICE ---
  const renderDeviceCard = (device: any) => {
    const liveData = realtimeData[device.macAddress] || {};
    const sensors =
      device.components?.filter((c: any) => c.type === "SENSOR") || [];
    const actuators =
      device.components?.filter((c: any) => c.type === "ACTUATOR") || [];

    return (
      <div
        key={device.id}
        className="mb-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      >
        {/* Header Device */}
        <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">{device.name}</h4>
              <p className="text-xs text-gray-500 font-mono tracking-tight">
                {device.macAddress}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleViewHistory(device.id)}
            className="text-xs flex items-center gap-1 text-gray-500 hover:text-green-600 font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
          >
            <History className="w-3.5 h-3.5" /> Riwayat
          </button>
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

                // Coba tebak icon dari nama sensor
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
                        <Thermometer className="w-4 h-4 text-orange-500" />
                      ) : isHumid ? (
                        <Droplets className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Activity className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {sensor.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-gray-900">
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
                    className="flex items-center justify-between bg-orange-50/30 px-3 py-2.5 rounded-lg border border-orange-100/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <Fan
                        className={`w-4 h-4 ${isOn ? "text-green-500 animate-spin-slow" : "text-gray-400"}`}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">
                          {actuator.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${isOn ? "text-green-600" : "text-gray-400"}`}
                        >
                          {isOn ? "Menyala" : "Mati"}
                        </span>
                      </div>
                    </div>

                    {/* Modern Toggle Switch */}
                    <button
                      onClick={() =>
                        handleToggleActuator(
                          device.id,
                          device.macAddress,
                          actuator,
                          isOn,
                        )
                      }
                      disabled={toggleMutation.isPending} // Disable saat loading API
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        isOn ? "bg-green-500" : "bg-gray-200"
                      } ${toggleMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isOn ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Jika Device Kosong */}
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

  return (
    <div className="space-y-8 bg-gray-50/30 min-h-screen pb-10">
      {/* Page Header */}
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
                {/* Area Header */}
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                  <div className="bg-green-100 p-2.5 rounded-xl text-green-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {area.name}
                  </h2>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-8">
                  {/* Kolom Kiri: Sensor / Campuran */}
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

                  {/* Kolom Kanan: Murni Aktuator */}
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
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
