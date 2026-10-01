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
  X,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Gauge,
  Sliders,
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
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DeviceComponentsSchema = z.object({
  name: z.string().min(2, "Name is required").trim(),
  type: z.enum(["SENSOR", "ACTUATOR"]),
  category: z.string().nullish(),
  unit: z.string().nullish(),
  pin: z.string().nullish(),
});

type DeviceComponentsFormType = z.infer<typeof DeviceComponentsSchema>;
type PeriodType = "24h" | "7d" | "30d" | "all";

export default function SuperAdminDeviceDetailPage() {
  const params = useParams();
  const router = useRouter();

  const deviceId = params.deviceId as string;

  // -- States --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any>(null);
  const [selectedData, setSelectedData] = useState<any>(null);

  // -- Sensor Log Table Modal State --
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [modalSelectedComp, setModalSelectedComp] = useState<any>(null);
  const [modalSensorPage, setModalSensorPage] = useState(1);

  // -- Main Chart States --
  const [activeSensorId, setActiveSensorId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("24h");
  const [isCopiedMac, setIsCopiedMac] = useState(false);

  // -- Pagination States --
  const [mainTablePage, setMainTablePage] = useState(1);
  const itemsPerPage = 6;

  // --- DATA FETCHING (Device Details) ---
  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGetGreenhouseDeviceDetails(deviceId);
  const device: any = (response as any)?.data || response;

  const effectiveGreenhouseId =
    device?.greenhouseId ||
    device?.greenhouse?.id ||
    device?.area?.greenhouseId ||
    device?.area?.idGreenhouse ||
    (params.greenhouseId as string) ||
    "";

  // Filter SENSOR components
  const sensorComponents: any[] = useMemo(() => {
    return (device?.components || []).filter(
      (comp: any) => comp.type === "SENSOR",
    );
  }, [device?.components]);

  // Filter ACTUATOR components
  const actuatorComponents: any[] = useMemo(() => {
    return (device?.components || []).filter(
      (comp: any) => comp.type === "ACTUATOR",
    );
  }, [device?.components]);

  // Set default active sensor once device data is loaded
  useEffect(() => {
    if (sensorComponents.length > 0 && !activeSensorId) {
      setActiveSensorId(sensorComponents[0].id);
    }
  }, [sensorComponents, activeSensorId]);

  // Active sensor object for chart
  const activeSensor = useMemo(() => {
    return (
      sensorComponents.find((c) => c.id === activeSensorId) ||
      sensorComponents[0] ||
      null
    );
  }, [sensorComponents, activeSensorId]);

  // Determine dynamic color theme based on sensor type/category
  const activeTheme = useMemo(() => {
    const text = `${activeSensor?.name || ""} ${activeSensor?.category || ""}`.toLowerCase();
    if (text.includes("temp") || text.includes("suhu") || text.includes("panas")) {
      return {
        stroke: "#f43f5e",
        fill: "#f43f5e",
        badgeBg: "bg-rose-50",
        badgeText: "text-rose-600",
        border: "border-rose-200",
        ring: "ring-rose-500/20",
        activeTab: "bg-rose-500 text-white shadow-rose-500/25",
        gradId: "saTempGrad",
        icon: TrendingUp,
      };
    }
    if (text.includes("hum") || text.includes("lembab") || text.includes("air") || text.includes("water")) {
      return {
        stroke: "#0284c7",
        fill: "#0ea5e9",
        badgeBg: "bg-sky-50",
        badgeText: "text-sky-600",
        border: "border-sky-200",
        ring: "ring-sky-500/20",
        activeTab: "bg-sky-500 text-white shadow-sky-500/25",
        gradId: "saHumGrad",
        icon: Activity,
      };
    }
    if (text.includes("ph") || text.includes("ec") || text.includes("tds") || text.includes("nutrisi")) {
      return {
        stroke: "#7c3aed",
        fill: "#8b5cf6",
        badgeBg: "bg-purple-50",
        badgeText: "text-purple-600",
        border: "border-purple-200",
        ring: "ring-purple-500/20",
        activeTab: "bg-purple-500 text-white shadow-purple-500/25",
        gradId: "saPhGrad",
        icon: Gauge,
      };
    }
    return {
      stroke: "#059669",
      fill: "#10b981",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-600",
      border: "border-emerald-200",
      ring: "ring-emerald-500/20",
      activeTab: "bg-emerald-500 text-white shadow-emerald-500/25",
      gradId: "saSensorGrad",
      icon: Activity,
    };
  }, [activeSensor]);

  // Dynamic limit based on period: 24h = 300 points (288 for 5m interval), 7d = 2100 points, 30d/all = 5000
  const chartFetchLimit = useMemo(() => {
    if (selectedPeriod === "24h") return 300;
    if (selectedPeriod === "7d") return 2100;
    return 5000;
  }, [selectedPeriod]);

  // --- DATA FETCHING: Historical Data for Main Chart ---
  const {data: chartHistoryResponse, isLoading: isLoadingChart} =
    useGetGreenhouseDeviceComponentSensor(
      effectiveGreenhouseId,
      activeSensor?.id,
      1,
      chartFetchLimit,
      selectedPeriod,
    );

  const chartRawData: any[] =
    (chartHistoryResponse as any)?.data?.data ||
    (chartHistoryResponse as any)?.data ||
    [];

  // Prepare chart formatted data (reverse so oldest is left, newest is right)
  const chartPoints = useMemo(() => {
    if (!Array.isArray(chartRawData)) return [];
    return [...chartRawData].reverse().map((item: any) => {
      const date = new Date(item.createdAt || item.deviceTime || Date.now());
      return {
        id: item.id,
        rawDate: date,
        time:
          selectedPeriod === "24h"
            ? date
                .toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })
                .replace(/\./g, ":")
            : date.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
        value: Number(item.value),
      };
    });
  }, [chartRawData, selectedPeriod]);

  // Summary statistics (Latest, Min, Max, Average)
  const chartStats = useMemo(() => {
    if (chartPoints.length === 0) {
      return {latest: null, avg: null, min: null, max: null};
    }
    const values = chartPoints.map((p) => p.value);
    const latest = values[values.length - 1];
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {latest, avg, min, max};
  }, [chartPoints]);

  // --- DATA FETCHING: Sensor Log Modal Data ---
  const {data: modalSensorResponse, isLoading: isLoadingModalSensor} =
    useGetGreenhouseDeviceComponentSensor(
      effectiveGreenhouseId,
      modalSelectedComp?.id,
      modalSensorPage,
      10,
      "all",
    );
  const modalSensorDataArray: any[] =
    (modalSensorResponse as any)?.data?.data ||
    (modalSensorResponse as any)?.data ||
    [];
  const modalSensorPagination =
    (modalSensorResponse as any)?.data?.pagination ||
    (modalSensorResponse as any)?.pagination;

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

  const handleOpenLogModal = (component: any) => {
    setModalSelectedComp(component);
    setModalSensorPage(1);
    setIsLogModalOpen(true);
  };

  const handleOpenedHistory = (data: any, y: boolean) => {
    setIsHistoryOpen(y);
    setHistoryLogs(data);
  };

  const handleCopyMac = () => {
    if (device?.macAddress) {
      navigator.clipboard.writeText(device.macAddress);
      setIsCopiedMac(true);
      setTimeout(() => setIsCopiedMac(false), 2000);
    }
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
        toast.success(res.message || "Component berhasil disimpan");
        setIsModalOpen(false);
        refetch();
      },
      onError: (err: any) => toast.error(err.message),
    };

    if (selectedData) {
      updateMutation.mutate(
        {
          componentId: selectedData.id,
          deviceId,
          idGreenhouse: effectiveGreenhouseId,
          ...data,
        },
        options,
      );
    } else {
      createMutation.mutate({idDevice: deviceId, ...data}, options);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus komponen ini?")) {
      deleteMutation.mutate(
        {componentId: id, deviceId, idGreenhouse: effectiveGreenhouseId},
        {
          onSuccess: () => {
            toast.success("Komponen berhasil dihapus");
            refetch();
          },
          onError: (err: any) => toast.error(err.message),
        },
      );
    }
  };

  // --- COLUMNS CONFIG (Main Table Components) ---
  const columns: TableColumn<any>[] = [
    {
      header: "Nama Komponen",
      cell: (row) => (
        <div className="flex items-center gap-3.5 py-1">
          <div
            className={`p-2.5 rounded-xl transition-all ${
              row.type === "SENSOR"
                ? "bg-blue-50/80 text-blue-600 ring-1 ring-blue-100"
                : "bg-amber-50/80 text-amber-600 ring-1 ring-amber-100"
            }`}
          >
            {row.type === "SENSOR" ? (
              <Activity className="w-4 h-4" />
            ) : (
              <Fan className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm tracking-tight">
              {row.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                  row.type === "SENSOR"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {row.type}
              </span>
              {row.category && (
                <span className="text-[10px] text-gray-400 font-medium">
                  • {row.category}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Satuan / Unit",
      cell: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-gray-100/70 text-gray-700 border border-gray-200/50">
          {row.unit || "-"}
        </span>
      ),
    },
    {
      header: "Pin Hardware",
      cell: (row) => (
        <code className="text-xs font-mono font-bold bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-lg shadow-inner">
          {row.pin || "AUTO"}
        </code>
      ),
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.type === "SENSOR" && (
            <>
              <button
                onClick={() => {
                  setActiveSensorId(row.id);
                  const el = document.getElementById("sensor-chart-section");
                  if (el) el.scrollIntoView({behavior: "smooth"});
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1 active:scale-95 ${
                  activeSensorId === row.id
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
                title="Tampilkan di Grafik"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Grafik</span>
              </button>
              <button
                onClick={() => handleOpenLogModal(row)}
                className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-all flex items-center gap-1 shadow-xs active:scale-95"
                title="Buka Tabel Log"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Logs</span>
              </button>
            </>
          )}

          {/* Super Admin Edit & Delete Component Buttons */}
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-100 transition-all active:scale-95"
            title="Edit Komponen"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100 transition-all active:scale-95"
            title="Hapus Komponen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // --- COLUMNS CONFIG (History Logs Modal) ---
  const historyColumns: TableColumn<any>[] = [
    {
      header: "Status Node",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              row.state === "ONLINE"
                ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                : "bg-rose-500 shadow-sm shadow-rose-500/50"
            }`}
          />
          <span
            className={`text-xs font-extrabold ${
              row.state === "ONLINE" ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            {row.state}
          </span>
        </div>
      ),
    },
    {
      header: "Waktu Terdeteksi",
      cell: (row) => {
        if (!row.createAt) return "-";
        const date = new Date(row.createAt);
        return (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-900 font-mono">
              {date
                .toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })
                .replace(/\./g, ":")}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
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
      header: "Keterangan",
      cell: (row) => (
        <span className="text-xs text-gray-500 italic">
          {row.reason || "-"}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
          <Activity className="w-6 h-6 text-emerald-600 animate-spin" />
        </div>
        <p className="text-sm font-bold text-gray-600 animate-pulse">
          Memuat konfigurasi node super admin...
        </p>
      </div>
    );
  }

  if (isError || !device) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center bg-rose-50/70 border border-rose-200 rounded-3xl space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <X className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          Node Device Tidak Ditemukan
        </h2>
        <p className="text-xs text-gray-500">
          Perangkat ini mungkin telah dihapus atau tidak terdaftar pada sistem.
        </p>
        <Button
          onClick={() => router.push("/dashboard/super-admin/device")}
          variant="primary"
          className="mt-2 rounded-xl"
        >
          Kembali ke Daftar Perangkat
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 main-container-print">
      {/* 1. TOP COMMAND BAR & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-gray-100 shadow-sm sticky top-0 z-20 print-hide">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => router.push(`/dashboard/super-admin/device`)}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl border border-gray-200/60 transition-all active:scale-95 shadow-xs"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                Super Admin
              </span>
              <span className="text-xs text-gray-400 font-medium">/</span>
              <span className="text-xs font-semibold text-gray-500">
                {device.greenhouse?.name || device.area?.name || "Global Node"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
              {device.name}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-2xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Muat Ulang Data"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-500 ${
                isRefetching ? "animate-spin text-emerald-600" : ""
              }`}
            />
            <span className="hidden md:inline">Refresh</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Print Sticker Barcode / Thermal Label"
          >
            <Printer className="w-4 h-4 text-gray-600" />
            <span className="hidden lg:inline">Print Label</span>
          </button>

          <button
            onClick={() => handleOpenedHistory(device.statusLogs, true)}
            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-2xl font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2"
            title="Riwayat Koneksi Hidup/Mati"
          >
            <History className="w-4 h-4 text-rose-600" />
            <span>Connection Logs</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Komponen</span>
          </button>
        </div>
      </div>

      {/* 2. HERO NODE OVERVIEW CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-hide">
        {/* Hardware MAC */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 group-hover:scale-105 transition-transform">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                MAC Address
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-black text-gray-900 font-mono tracking-tight">
                  {device.macAddress}
                </p>
                <button
                  onClick={handleCopyMac}
                  className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-700 transition-colors"
                  title="Salin MAC Address"
                >
                  {isCopiedMac ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Location Area / Greenhouse */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                Penempatan Area / Greenhouse
              </p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {device.area?.name || device.greenhouse?.name || "Global / Unassigned"}
              </p>
            </div>
          </div>
        </div>

        {/* Last Seen & Heartbeat */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600 ring-1 ring-purple-100 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                Terakhir Terlihat
              </p>
              <p className="text-sm font-bold text-gray-900 font-mono mt-0.5">
                {device.lastSeen
                  ? new Date(device.lastSeen).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "BELUM PERNAH"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SENSOR HISTORICAL TELEMETRY STUDIO (MAIN PAGE SECTION) */}
      <div id="sensor-chart-section" className="space-y-4 pt-1 print-hide">
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 tracking-tight">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Sensor Telemetry Studio
            </h3>
            <p className="text-xs text-gray-500">
              Analisis grafik riwayat telemetri sensor tersimpan dari database
            </p>
          </div>

          {activeSensor && (
            <button
              onClick={() => handleOpenLogModal(activeSensor)}
              className="self-start sm:self-auto px-4 py-2 text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-2xl shadow-xs transition-all flex items-center gap-2 active:scale-95"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Buka Tabel Log Riwayat</span>
            </button>
          )}
        </div>

        {sensorComponents.length > 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-5 sm:p-7 space-y-6">
            {/* SENSOR SWITCHER RIBBON / TABS */}
            {sensorComponents.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-gray-400 tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-gray-400" />
                  Pilih Komponen Sensor:
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {sensorComponents.map((comp) => {
                    const isActive = comp.id === activeSensor?.id;
                    return (
                      <button
                        key={comp.id}
                        onClick={() => setActiveSensorId(comp.id)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2.5 active:scale-95 ${
                          isActive
                            ? `${activeTheme.activeTab} shadow-lg ring-2 ${activeTheme.ring}`
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60"
                        }`}
                      >
                        <Activity
                          className={`w-4 h-4 ${
                            isActive ? "text-white" : "text-gray-400"
                          }`}
                        />
                        <span>{comp.name}</span>
                        {comp.unit && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                              isActive
                                ? "bg-black/20 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {comp.unit}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CHART CANVAS HEADER & CONTROLS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 border-t border-gray-100">
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-3 rounded-2xl ${activeTheme.badgeBg} ${activeTheme.badgeText} border ${activeTheme.border}`}
                >
                  <activeTheme.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                      {activeSensor?.name}
                    </h4>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${activeTheme.badgeBg} ${activeTheme.badgeText}`}
                    >
                      {activeSensor?.category || "Sensor"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Hardware Key ID: <span className="font-mono text-gray-600">{activeSensor?.id}</span>
                  </p>
                </div>
              </div>

              {/* Period Selector Segmented Control */}
              <div className="flex items-center gap-1 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/50 self-start md:self-auto">
                {(
                  [
                    {key: "24h", label: "24 Jam"},
                    {key: "7d", label: "7 Hari (Mingguan)"},
                    {key: "30d", label: "30 Hari (Bulanan)"},
                    {key: "all", label: "Semua"},
                  ] as {key: PeriodType; label: string}[]
                ).map((period) => {
                  const isSelected = selectedPeriod === period.key;
                  return (
                    <button
                      key={period.key}
                      onClick={() => setSelectedPeriod(period.key)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-white text-gray-900 shadow-sm font-black"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                      }`}
                    >
                      {period.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KPI STAT HIGHLIGHTS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <StatBox
                label="Nilai Terkini"
                val={
                  chartStats.latest !== null
                    ? `${chartStats.latest.toFixed(
                        activeSensor?.category?.toLowerCase().includes("ph")
                          ? 2
                          : 1,
                      )} ${activeSensor?.unit || ""}`
                    : "-"
                }
                sub="Telemetri Terakhir"
                icon={TrendingUp}
                color="text-emerald-600 bg-emerald-50 border-emerald-100"
              />
              <StatBox
                label="Rata-rata (Avg)"
                val={
                  chartStats.avg !== null
                    ? `${chartStats.avg.toFixed(
                        activeSensor?.category?.toLowerCase().includes("ph")
                          ? 2
                          : 1,
                      )} ${activeSensor?.unit || ""}`
                    : "-"
                }
                sub="Dalam Periode Terpilih"
                icon={Activity}
                color="text-blue-600 bg-blue-50 border-blue-100"
              />
              <StatBox
                label="Titik Minimum"
                val={
                  chartStats.min !== null
                    ? `${chartStats.min.toFixed(
                        activeSensor?.category?.toLowerCase().includes("ph")
                          ? 2
                          : 1,
                      )} ${activeSensor?.unit || ""}`
                    : "-"
                }
                sub="Nilai Terendah"
                icon={TrendingDown}
                color="text-cyan-600 bg-cyan-50 border-cyan-100"
              />
              <StatBox
                label="Titik Maksimum"
                val={
                  chartStats.max !== null
                    ? `${chartStats.max.toFixed(
                        activeSensor?.category?.toLowerCase().includes("ph")
                          ? 2
                          : 1,
                      )} ${activeSensor?.unit || ""}`
                    : "-"
                }
                sub="Nilai Tertinggi"
                icon={TrendingUp}
                color="text-rose-600 bg-rose-50 border-rose-100"
              />
            </div>

            {/* MAIN CHART CANVAS */}
            <div className="bg-slate-50/60 border border-gray-100 rounded-3xl p-4 sm:p-6 min-h-[360px] flex flex-col justify-center">
              {isLoadingChart ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                  <Activity className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="text-xs font-bold text-gray-500">
                    Memuat data historis telemetri dari database...
                  </p>
                </div>
              ) : chartPoints.length > 0 ? (
                <div className="h-[320px] sm:h-[380px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartPoints}
                      margin={{top: 15, right: 15, left: -20, bottom: 5}}
                    >
                      <defs>
                        <linearGradient
                          id={activeTheme.gradId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={activeTheme.fill}
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor={activeTheme.fill}
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="time"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        stroke="#94a3b8"
                        dy={8}
                      />
                      <YAxis
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        stroke="#94a3b8"
                        dx={-4}
                        unit={activeSensor?.unit ? ` ${activeSensor.unit}` : ""}
                      />
                      <Tooltip
                        content={({active, payload}) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1">
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {data.time}
                                </p>
                                <p className="font-black text-base text-emerald-400 font-mono">
                                  {data.value}{" "}
                                  <span className="text-xs font-sans text-slate-300">
                                    {activeSensor?.unit}
                                  </span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={activeTheme.stroke}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill={`url(#${activeTheme.gradId})`}
                        dot={{
                          r: 3,
                          fill: activeTheme.stroke,
                          strokeWidth: 1.5,
                          stroke: "#fff",
                        }}
                        activeDot={{
                          r: 6,
                          stroke: "#fff",
                          strokeWidth: 2.5,
                          fill: activeTheme.stroke,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2 border border-dashed border-gray-200 rounded-3xl bg-white">
                  <BarChart3 className="w-10 h-10 text-gray-300" />
                  <p className="text-sm font-bold text-gray-700">
                    Belum Ada Data Riwayat Telemetri
                  </p>
                  <p className="text-xs text-gray-400 text-center max-w-sm">
                    Sensor ini belum mencatat data pada periode {selectedPeriod}. Data akan otomatis terupdate saat ESP32 aktif mengirim log.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center text-gray-400 space-y-2 shadow-sm">
            <Cpu className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-800 text-base">
              Tidak Ada Komponen Sensor
            </p>
            <p className="text-xs text-gray-400">
              Perangkat ini belum memiliki komponen dengan tipe SENSOR. Klik tombol &quot;+ Tambah Komponen&quot; di atas untuk menambahkan.
            </p>
          </div>
        )}
      </div>

      {/* 4. ATTACHED HARDWARE COMPONENTS TABLE */}
      <div className="space-y-4 pt-2 print-hide">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 tracking-tight">
              <Cpu className="w-5 h-5 text-emerald-600" />
              Attached Hardware Components
            </h3>
            <p className="text-xs text-gray-500">
              Daftar seluruh sensor dan aktuator yang terkonfigurasi pada node ini
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              {sensorComponents.length} Sensor
            </span>
            <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              {actuatorComponents.length} Actuator
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <Table
            columns={columns}
            data={paginatedComponents}
            emptyMessage="Belum ada komponen hardware yang terpasang pada node ini."
          />
        </div>

        {totalMainPages > 1 && (
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-bold tracking-wider ml-2">
              Menampilkan {paginatedComponents.length} dari{" "}
              {device?.components?.length || 0} komponen
            </p>
            <div className="flex items-center gap-1.5">
              <button
                className="h-8 w-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"
                disabled={mainTablePage === 1}
                onClick={() => setMainTablePage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex gap-1">
                {Array.from({length: totalMainPages}, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setMainTablePage(pageNum)}
                      className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                        mainTablePage === pageNum
                          ? "bg-gray-900 text-white shadow-sm font-black"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </div>
              <button
                className="h-8 w-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"
                disabled={mainTablePage >= totalMainPages}
                onClick={() => setMainTablePage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- 5. MODAL CONNECTION LOGS (NODE PRESENCE / STATUS LOGS) --- */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md print-hide">
            <motion.div
              initial={{opacity: 0, scale: 0.95, y: 15}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.95, y: 15}}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-900 tracking-tight">
                      Node Connection Logs
                    </h3>
                    <p className="text-xs text-gray-400">
                      Riwayat deteksi waktu hidup (ONLINE) dan mati (OFFLINE)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenedHistory([], false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
                  <Table
                    columns={historyColumns}
                    data={historyLogs || []}
                    emptyMessage="Belum ada catatan riwayat koneksi untuk node ini."
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50/50 border-t flex justify-end">
                <button
                  onClick={() => handleOpenedHistory([], false)}
                  className="px-6 py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                >
                  Tutup Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- 6. MODAL SENSOR HISTORICAL LOG READINGS (POP-UP TABEL LOG) --- */}
      <AnimatePresence>
        {isLogModalOpen && modalSelectedComp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md print-hide">
            <motion.div
              initial={{opacity: 0, scale: 0.95, y: 15}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.95, y: 15}}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
            >
              {/* Modal Header */}
              <div className="px-7 py-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 ring-1 ring-emerald-100">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-900 tracking-tight">
                      Riwayat Log: {modalSelectedComp.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold uppercase">
                        {modalSelectedComp.category || "Sensor"}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">
                        • Satuan: {modalSelectedComp.unit || "N/A"}
                      </span>
                      {modalSensorPagination && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          (Total {modalSensorPagination.totalData} entri)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Data Table */}
              <div className="p-6 overflow-y-auto flex-grow bg-slate-50/40 custom-scrollbar">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
                  <Table
                    isLoading={isLoadingModalSensor}
                    columns={[
                      {
                        header: "Waktu Telemetri",
                        cell: (r: any) => {
                          const date = new Date(
                            r.createdAt || r.deviceTime || Date.now(),
                          );
                          return (
                            <div className="flex flex-col font-mono text-xs">
                              <span className="font-bold text-gray-900">
                                {date
                                  .toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                  })
                                  .replace(/\./g, ":")}
                              </span>
                              <span className="text-[10px] text-gray-400 font-sans">
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
                        header: "Nilai Terukur",
                        cell: (r: any) => (
                          <span className="font-black text-emerald-600 text-sm tracking-tight font-mono">
                            {Number(r.value).toFixed(
                              modalSelectedComp.category
                                ?.toLowerCase()
                                .includes("ph")
                                ? 2
                                : 1,
                            )}{" "}
                            <span className="text-[10px] font-bold text-gray-400 font-sans uppercase">
                              {modalSelectedComp.unit}
                            </span>
                          </span>
                        ),
                      },
                      {
                        header: "Kualitas Data",
                        cell: () => (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            VALID
                          </span>
                        ),
                      },
                    ]}
                    data={
                      Array.isArray(modalSensorDataArray)
                        ? modalSensorDataArray
                        : []
                    }
                    emptyMessage="Belum ada log telemetri yang tercatat untuk sensor ini."
                  />
                </div>
              </div>

              {/* Modal Footer: Pagination & Close */}
              <div className="px-6 py-4 bg-white border-t flex items-center justify-between gap-3 sticky bottom-0 z-10">
                {modalSensorPagination &&
                modalSensorPagination.totalPages > 1 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">
                      Halaman {modalSensorPagination.currentPage} dari{" "}
                      {modalSensorPagination.totalPages}
                    </span>
                    <div className="flex gap-1">
                      <button
                        className="h-8 w-8 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 shadow-xs"
                        disabled={modalSensorPage === 1}
                        onClick={() => setModalSensorPage((p) => p - 1)}
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        className="h-8 w-8 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 shadow-xs"
                        disabled={
                          modalSensorPage >= modalSensorPagination.totalPages
                        }
                        onClick={() => setModalSensorPage((p) => p + 1)}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-6 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. GENERIC FORM MODAL: ADD / EDIT COMPONENT */}
      <GenericFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedData ? "Edit Komponen Hardware" : "Tambah Komponen Hardware Baru"}
        schema={DeviceComponentsSchema}
        fields={[
          {name: "name", label: "Nama Komponen"},
          {
            name: "type",
            label: "Tipe Komponen",
            type: "select",
            options: [
              {label: "Sensor", value: "SENSOR"},
              {label: "Actuator", value: "ACTUATOR"},
            ],
          },
          {name: "category", label: "Kategori (e.g. Temperature, Humidity, pH, Fan)"},
          {name: "unit", label: "Satuan / Unit (e.g. °C, %, pH, RPM)"},
          {name: "pin", label: "Hardware Pin / Key (e.g. D4, GPIO21, Auto)"},
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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

function StatBox({label, val, sub, icon: Icon, color}: any) {
  return (
    <div
      className={`p-4 rounded-2xl border bg-white flex items-center gap-3.5 shadow-xs transition-all hover:shadow-sm`}
    >
      <div className={`p-3 rounded-2xl ${color} border`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
          {label}
        </p>
        <p className="text-base font-black text-gray-900 font-mono tracking-tight mt-0.5">
          {val}
        </p>
        <p className="text-[10px] text-gray-400 font-medium">{sub}</p>
      </div>
    </div>
  );
}
