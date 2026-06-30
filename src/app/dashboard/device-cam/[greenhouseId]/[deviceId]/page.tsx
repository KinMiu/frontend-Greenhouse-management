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

  // -- States untuk Streaming Kamera --
  const [isConnected, setIsConnected] = useState(false);
  const [cameraFrame, setCameraFrame] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const prevUrlRef = useRef<string | null>(null);

  // --- DATA DUMMY ---
  // Karena ini testing dummy, kita buat data statis alih-alih fetch API
  const device = {
    id: params.deviceId as string,
    name: "Kamera Utama (Dummy Worker)",
    macAddress: "FF:EE:DD:CC:BB:AA",
    area: {name: "Area Pemantauan Kamera"},
    status: "ONLINE",
  };

  // --- WEBSOCKET CONNECTION ---
  useEffect(() => {
    // Sesuaikan URL ini dengan endpoint Gateway Worker yang bertugas melakukan broadcast frame.
    // Jika Gateway Worker awal hanya me-log data, pastikan di Golang-nya kamu juga membuat endpoint
    // untuk frontend, misalnya ws://localhost:8080/ws/viewer
    const wsUrl = "wss://urken.psti-ubl.id/ws/viewer"; // Gunakan URL WS milikmu

    const ws = new WebSocket(wsUrl);

    // Kita beritahu browser bahwa data binary yang datang bentuknya adalah Blob (File)
    ws.binaryType = "blob";

    ws.onopen = () => {
      console.log("✅ Connected to Camera Stream WebSocket");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      // Pastikan data yang diterima adalah binary (Blob dari gambar JPEG)
      if (event.data instanceof Blob) {
        // Hapus URL gambar sebelumnya dari memori browser agar tidak memory leak (RAM penuh)
        if (prevUrlRef.current) {
          URL.revokeObjectURL(prevUrlRef.current);
        }

        // Buat URL lokal untuk blob gambar yang baru masuk
        const newFrameUrl = URL.createObjectURL(event.data);
        setCameraFrame(newFrameUrl);
        prevUrlRef.current = newFrameUrl;

        // Counter untuk animasi indikator live
        setFrameCount((prev) => prev + 1);
      } else {
        // Jika data berupa text
        console.error("Gagal memproses frame dari server:", e);
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);

      // LOG DETAIL PENYEBAB CLOSE
      console.error("❌ WebSocket Disconnected!");
      console.log("Code:", event.code); // 1000 = Normal, 1006 = Abnormal (Server crash/Nginx cut)
      console.log("Reason:", event.reason); // Penjelasan kenapa server mutus
      console.log("Was Clean:", event.wasClean);
    };

    ws.onerror = (error) => {
      // LOG DETAIL ERROR
      console.error("⚠️ WebSocket Error Detail:", error);
      // Cek apakah browser memberikan info tambahan di event
      console.log("Target URL:", error.target);
    };

    return () => {
      // Cleanup saat pindah halaman
      ws.close();
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

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
              Live Real-time Monitoring Stream
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Indikator Status Koneksi */}
          <div
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 border ${isConnected ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
            />
            {isConnected ? "WS CONNECTED" : "WS DISCONNECTED"}
          </div>
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
          val={device.area.name}
          icon={MapPin}
          color="text-orange-500"
        />
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="p-2 rounded-lg bg-gray-50 text-purple-500">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
              Total Frames
            </p>
            <p className="text-xs font-bold text-gray-700 font-mono mt-0.5">
              {frameCount} frames received
            </p>
          </div>
        </div>
      </div>

      {/* 3. CAMERA STREAM VIEWER */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            Live View
          </h3>
          {isConnected && (
            <span className="text-[10px] bg-red-100 text-red-600 font-black uppercase tracking-wider px-2 py-1 rounded animate-pulse">
              • LIVE
            </span>
          )}
        </div>

        {/* Area Penampil Gambar */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {cameraFrame ? (
            // Jika ada frame yang masuk, tampilkan
            <img
              src={cameraFrame}
              alt="Live Camera Stream"
              className="w-full h-full object-contain"
            />
          ) : (
            // Jika belum ada data yang masuk
            <div className="flex flex-col items-center justify-center text-gray-500 gap-3">
              {isConnected ? (
                <>
                  <Activity className="w-10 h-10 animate-pulse text-gray-400" />
                  <p className="text-sm font-medium">
                    Waiting for video stream...
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-10 h-10 text-gray-600" />
                  <p className="text-sm font-medium">
                    WebSocket is disconnected
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Komponen InfoCard yang disederhanakan
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
