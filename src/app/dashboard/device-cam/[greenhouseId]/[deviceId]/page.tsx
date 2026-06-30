/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {useParams, useRouter} from "next/navigation";
import {
  Wifi,
  MapPin,
  ArrowLeft,
  Video,
  Activity,
  AlertCircle,
} from "lucide-react";
import Button from "@/src/components/ui/button";
import {useState, useEffect, useRef} from "react";
import {motion} from "framer-motion";

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [isConnected, setIsConnected] = useState(false);
  const [cameraFrame, setCameraFrame] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const prevUrlRef = useRef<string | null>(null);

  const device = {
    id: params.deviceId as string,
    name: "Kamera Utama (Dummy Worker)",
    macAddress: "FF:EE:DD:CC:BB:AA",
    area: {name: "Area Pemantauan Kamera"},
    status: "ONLINE",
  };

  useEffect(() => {
    const wsUrl = "wss://urken.psti-ubl.id/ws/viewer";
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "blob";

    ws.onopen = () => {
      console.log("✅ Connected to Camera Stream WebSocket");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        if (prevUrlRef.current) {
          URL.revokeObjectURL(prevUrlRef.current);
        }
        const newFrameUrl = URL.createObjectURL(event.data);
        setCameraFrame(newFrameUrl);
        prevUrlRef.current = newFrameUrl;
        setFrameCount((prev) => prev + 1);
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      console.error("❌ WebSocket Disconnected!", event.code);
    };

    ws.onerror = (error) => {
      console.error("⚠️ WebSocket Error Detail:", error);
    };

    return () => {
      ws.close();
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl transition-all"
            onClick={() => router.push(`/dashboard/device`)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
              {device.name}
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm">
              Live Real-time Monitoring Stream
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <div
            className={`px-3 py-1.5 rounded-full font-bold text-[11px] flex items-center gap-2 border shadow-xs transition-all ${
              isConnected
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-rose-50 text-rose-600 border-rose-200"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
            />
            {isConnected ? "WS CONNECTED" : "WS DISCONNECTED"}
          </div>
        </div>
      </div>

      {/* ⚙️ FIX LAYOUT: Menggunakan susunan Grid 2 Kolom di Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: CAMERA VIEWER (Lebih kompak & proporsional) */}
        <motion.div
          initial={{opacity: 0, y: 15}}
          animate={{opacity: 1, y: 0}}
          className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col"
        >
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-500" />
              Live CCTV Stream
            </h3>
            {isConnected && (
              <span className="text-[9px] bg-rose-500 text-white font-black uppercase tracking-widest px-2 py-0.5 rounded-sm animate-pulse">
                REC
              </span>
            )}
          </div>

          {/* 🛠️ FIX AREA VIDEO: Membatasi tinggi maksimal agar tidak kegedean */}
          <div className="relative w-full aspect-video max-h-[400px] bg-zinc-950 flex items-center justify-center overflow-hidden border-t border-gray-900">
            {cameraFrame ? (
              <img
                src={cameraFrame}
                alt="Live Camera Stream"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500 gap-2 p-6">
                {isConnected ? (
                  <>
                    <Activity className="w-8 h-8 animate-spin text-green-500" />
                    <p className="text-xs font-medium tracking-wide text-zinc-400">
                      Decoding incoming binary frames...
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-8 h-8 text-zinc-600" />
                    <p className="text-xs font-medium text-zinc-500">
                      Stream offline • Awaiting server handshake
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT COLUMN: METRICS & SPECIFICATIONS */}
        <div className="flex flex-col gap-4">
          <div className="px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Device Specifications
            </h4>
          </div>

          <InfoCard
            label="Hardware MAC Address"
            val={device.macAddress}
            icon={Wifi}
            color="text-blue-500 bg-blue-50"
          />
          <InfoCard
            label="Assigned Location"
            val={device.area.name}
            icon={MapPin}
            color="text-orange-500 bg-orange-50"
          />

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4 shadow-xs">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                Data Throughput
              </p>
              <p className="text-sm font-bold text-gray-700 font-mono mt-0.5">
                {frameCount.toLocaleString()}{" "}
                <span className="text-xs font-normal text-gray-400">
                  frames received
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen InfoCard yang disempurnakan styling-nya
function InfoCard({label, val, icon: Icon, color}: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4 shadow-xs hover:border-gray-300 transition-colors">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
          {label}
        </p>
        <p className="text-sm font-bold text-gray-700 font-mono mt-0.5 tracking-tight">
          {val}
        </p>
      </div>
    </div>
  );
}
