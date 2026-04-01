/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {useGetGreenhouseAreas} from "@/src/hooks/use-area";
import {useGetMyGreenhouses} from "@/src/hooks/use-greenhouses";
import {GreenhousesType} from "@/src/types";
import {motion} from "framer-motion";
import {useEffect, useState} from "react";
import {Activity, Cpu, History} from "lucide-react";
import mqtt from "mqtt";

export default function DashboardPage() {
  const [selectedGreenhouseId, setSelectedGreenhouseId] = useState<string>("");
  const [realtimeData, setRealtimeData] = useState<{[mac: string]: any}>({});

  const {data: greenhouses = [], isLoading: isLoadingGreenhouse} =
    useGetMyGreenhouses();

  const {data: areas = [], isLoading: isLoadingAreas} =
    useGetGreenhouseAreas(selectedGreenhouseId);

  useEffect(() => {
    const client = mqtt.connect("ws://195.35.23.135:15675/ws", {
      username: "/smk2pkl:smk2iot",
      password: "smk2iot",
      clientId: `nextjs_${Math.random().toString(16).slice(3)}`,
      protocolId: "MQTT",
    });

    client.on("connect", () => {
      console.log("Connected to MQTT Broker via WebSockets");

      areas.data?.forEach((area: any) => {
        area.devices?.forEach((device: any) => {
          if (device.id) {
            client.subscribe(device.macAddress);
            console.log("Subscribed to topic:", device.id);
          }
        });
      });
    });

    client.on("message", (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(data);
        setRealtimeData((prev) => ({
          ...prev,
          [topic]: data,
        }));
      } catch (e) {
        console.error("Error parsing MQTT message", e);
      }
    });

    return () => {
      if (client) client.end();
    };
  }, [areas]);

  useEffect(() => {
    if (greenhouses.data?.length > 0 && selectedGreenhouseId === "") {
      setSelectedGreenhouseId(greenhouses.data[0].id);
    }
  }, [greenhouses, selectedGreenhouseId]);

  const handleViewHistory = (deviceId: string) => {
    console.log("Buka riwayat untuk device:", deviceId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard Real-time
        </h1>
        <p className="text-gray-500">
          Monitoring greenhouse dengan koneksi MQTT.
        </p>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <select
          value={selectedGreenhouseId}
          onChange={(e) => setSelectedGreenhouseId(e.target.value)}
          disabled={isLoadingGreenhouse}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-green-500 shadow-sm"
        >
          {greenhouses.data?.map((gh: GreenhousesType) => (
            <option key={gh.id} value={gh.id}>
              {gh.name}
            </option>
          ))}
        </select>
      </div>

      {isLoadingAreas ? (
        <div className="flex justify-center items-center h-40 text-gray-400">
          Loading dashboard data...
        </div>
      ) : (
        <motion.div
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          className="space-y-8"
        >
          {areas.data?.map((area: any, index: number) => (
            <div key={area.id || index} className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-xl font-bold text-gray-800">{area.name}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {area.devices?.map((device: any) => {
                  const liveData = realtimeData[device.macAddress];

                  return (
                    <div
                      key={device.id}
                      className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-green-400 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            {device.status !== "ERROR" ? (
                              <Activity className="w-5 h-5 text-blue-500" />
                            ) : (
                              <Cpu className="w-5 h-5 text-orange-500" />
                            )}
                            <span className="font-semibold text-gray-700">
                              {device.name}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${device.status === "ONLINE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                          >
                            {device.status || "OFFLINE"}
                          </span>
                        </div>

                        {/* DISPLAY DATA MQTT */}
                        <div className="mt-2 mb-4">
                          <div className="text-3xl font-bold text-gray-800">
                            {liveData ? `${liveData.suhu}°C` : "--"}
                          </div>
                          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                            Humidity:{" "}
                            {liveData ? `${liveData.kelembapan}%` : "--"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 mt-auto">
                        <button
                          onClick={() => handleViewHistory(device.id)}
                          className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-green-600 font-medium py-1.5 rounded-lg hover:bg-green-50"
                        >
                          <History className="w-4 h-4" /> Riwayat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
