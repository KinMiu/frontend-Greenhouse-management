/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {useParams, useRouter} from "next/navigation";
import {
  Cpu,
  Wifi,
  MapPin,
  Activity,
  Clock,
  ArrowLeft,
  Fan,
  History,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  FileText,
  Filter,
  CheckCircle2,
} from "lucide-react";
import Button from "@/src/components/ui/button";
import {useGetGreenhouseDeviceDetails} from "@/src/hooks/use-device";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {useState, useMemo, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {useGetGreenhouseDeviceComponentSensor} from "@/src/hooks/use-deviceComponentSensor";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PeriodType = "24h" | "7d" | "30d" | "all";

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();

  const deviceId = params.deviceId as string;
  const greenhouseId = params.greenhouseId as string;

  // -- Modal States --
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any>(null);

  // -- Sensor Log Table Modal State --
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [modalSelectedComp, setModalSelectedComp] = useState<any>(null);
  const [modalSensorPage, setModalSensorPage] = useState(1);

  // -- Main Chart States --
  const [activeSensorId, setActiveSensorId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("24h");

  // -- Pagination States --
  const [mainTablePage, setMainTablePage] = useState(1);
  const itemsPerPage = 5;

  // --- DATA FETCHING (Profil Device Utama) ---
  const {
    data: response,
    isLoading,
    isError,
  } = useGetGreenhouseDeviceDetails(deviceId);
  const device: any = (response as any)?.data || response;

  // Filter only SENSOR components
  const sensorComponents: any[] = useMemo(() => {
    return (device?.components || []).filter(
      (comp: any) => comp.type === "SENSOR",
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

  // --- DATA FETCHING: Historical Data for Main Chart ---
  const {data: chartHistoryResponse, isLoading: isLoadingChart} =
    useGetGreenhouseDeviceComponentSensor(
      greenhouseId,
      activeSensor?.id,
      1,
      150, // Fetch ample historical data points for chart
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
      greenhouseId,
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

  // --- HANDLERS ---
  const handleOpenLogModal = (component: any) => {
    setModalSelectedComp(component);
    setModalSensorPage(1);
    setIsLogModalOpen(true);
  };

  const handleOpenedHistory = (data: any, y: boolean) => {
    setIsHistoryOpen(y);
    setHistoryLogs(data);
  };

  // --- COLUMNS CONFIG (Main Table Components) ---
  const columns: TableColumn<any>[] = [
    {
      header: "Component",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              row.type === "SENSOR"
                ? "bg-blue-50 text-blue-600"
                : "bg-orange-50 text-orange-600"
            }`}
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
        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
          {row.pin || "Auto"}
        </code>
      ),
    },
    {
      header: "Action",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.type === "SENSOR" ? (
            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => {
                  setActiveSensorId(row.id);
                  const el = document.getElementById("sensor-chart-section");
                  if (el) el.scrollIntoView({behavior: "smooth"});
                }}
                variant="ghost"
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                  activeSensorId === row.id
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
                title="Tampilkan di Grafik"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1" />
                Grafik
              </Button>
              <Button
                onClick={() => handleOpenLogModal(row)}
                variant="ghost"
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs"
                title="Lihat Riwayat Log Tabel"
              >
                <FileText className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Riwayat Log
              </Button>
            </div>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
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
            className={`h-2 w-2 rounded-full ${
              row.state === "ONLINE" ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span
            className={`text-xs font-bold ${
              row.state === "ONLINE" ? "text-green-600" : "text-red-600"
            }`}
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
        const date = new Date(row.createAt);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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
              Hardware Configuration & Sensor Analytics Node
            </p>
          </div>
        </div>

        <div className="flex flex-row justify-center items-center gap-3">
          <div className="px-3 py-1.5 rounded-full font-bold text-[11px] flex items-center gap-2 border shadow-inner transition-all bg-emerald-50 text-emerald-600 border-emerald-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            NODE ONLINE
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
          label="Location Area"
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

      {/* 3. HISTORICAL SENSOR CHARTS & ANALYTICS SECTION (MAIN PAGE) */}
      <div id="sensor-chart-section" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Sensor Historical Analytics
            </h3>
            <p className="text-xs text-gray-500">
              Grafik riwayat telemetri sensor tersimpan berdasarkan periode waktu
            </p>
          </div>

          {activeSensor && (
            <Button
              onClick={() => handleOpenLogModal(activeSensor)}
              variant="ghost"
              className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Buka Tabel Log Riwayat
            </Button>
          )}
        </div>

        {/* Sensor Component Switcher Tabs */}
        {sensorComponents.length > 0 ? (
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            {/* Tabs for multiple sensor components */}
            {sensorComponents.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Sensor:
                </span>
                {sensorComponents.map((comp) => {
                  const isActive = comp.id === activeSensor?.id;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setActiveSensorId(comp.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        isActive
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                      }`}
                    >
                      <Activity
                        className={`w-3.5 h-3.5 ${
                          isActive ? "text-white" : "text-gray-400"
                        }`}
                      />
                      {comp.name}
                      {comp.unit && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isActive
                              ? "bg-emerald-600 text-emerald-100"
                              : "bg-gray-200/70 text-gray-500"
                          }`}
                        >
                          {comp.unit}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active Sensor Overview & Filters Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 leading-tight">
                      {activeSensor?.name || "Sensor Component"}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {activeSensor?.category || "Sensor"}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">
                        Satuan: {activeSensor?.unit || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Period Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 self-start md:self-auto">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Periode:
                </span>
                {(
                  [
                    {key: "24h", label: "24 Jam"},
                    {key: "7d", label: "7 Hari (Mingguan)"},
                    {key: "30d", label: "30 Hari (Bulanan)"},
                    {key: "all", label: "Semua"},
                  ] as {key: PeriodType; label: string}[]
                ).map((period) => (
                  <button
                    key={period.key}
                    onClick={() => setSelectedPeriod(period.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedPeriod === period.key
                        ? "bg-white text-emerald-700 shadow-sm border border-emerald-100"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/60"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick KPI Stat Pill Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatPill
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
                icon={TrendingUp}
                color="text-emerald-600 bg-emerald-50"
              />
              <StatPill
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
                icon={Activity}
                color="text-blue-600 bg-blue-50"
              />
              <StatPill
                label="Minimum"
                val={
                  chartStats.min !== null
                    ? `${chartStats.min.toFixed(
                        activeSensor?.category?.toLowerCase().includes("ph")
                          ? 2
                          : 1,
                      )} ${activeSensor?.unit || ""}`
                    : "-"
                }
                icon={TrendingDown}
                color="text-cyan-600 bg-cyan-50"
              />
              <StatPill
                label="Maksimum"
                val={
                  chartStats.max !== null
                    ? `${chartStats.max.toFixed(
                        activeSensor?.category?.toLowerCase().includes("ph")
                          ? 2
                          : 1,
                      )} ${activeSensor?.unit || ""}`
                    : "-"
                }
                icon={TrendingUp}
                color="text-rose-600 bg-rose-50"
              />
            </div>

            {/* Recharts Historical Chart */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-4 sm:p-6 min-h-[340px] flex flex-col justify-center">
              {isLoadingChart ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3 animate-pulse">
                  <Activity className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs font-semibold">
                    Memuat riwayat telemetri dari database...
                  </p>
                </div>
              ) : chartPoints.length > 0 ? (
                <div className="h-[320px] sm:h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartPoints}
                      margin={{top: 15, right: 15, left: -20, bottom: 5}}
                    >
                      <defs>
                        <linearGradient
                          id="sensorAreaGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="time"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        stroke="#9ca3af"
                        dy={8}
                      />
                      <YAxis
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        stroke="#9ca3af"
                        dx={-4}
                        unit={activeSensor?.unit ? ` ${activeSensor.unit}` : ""}
                      />
                      <Tooltip
                        content={({active, payload}) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-gray-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-gray-800 text-xs space-y-1">
                                <p className="text-[10px] text-gray-400 font-mono">
                                  {data.time}
                                </p>
                                <p className="font-bold text-sm text-emerald-400">
                                  {data.value}{" "}
                                  <span className="text-xs text-gray-300">
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
                        stroke="#059669"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#sensorAreaGrad)"
                        dot={{
                          r: 3,
                          fill: "#059669",
                          strokeWidth: 1.5,
                          stroke: "#fff",
                        }}
                        activeDot={{
                          r: 6,
                          stroke: "#fff",
                          strokeWidth: 2,
                          fill: "#10b981",
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2 border border-dashed border-gray-200 rounded-2xl bg-white">
                  <BarChart3 className="w-10 h-10 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-600">
                    Belum ada data riwayat untuk periode ini
                  </p>
                  <p className="text-xs text-gray-400 text-center max-w-sm">
                    Data sensor akan otomatis terisi saat ESP32 mengirim
                    telemetri ke sistem.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400 space-y-2 shadow-sm">
            <Cpu className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-700">
              Tidak Ada Komponen Sensor Terpasang
            </p>
            <p className="text-xs text-gray-400">
              Tambahkan komponen bertipe SENSOR pada node ini untuk melihat grafik
              riwayat.
            </p>
          </div>
        )}
      </div>

      {/* 4. HARDWARE COMPONENTS TABLE */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.4}}
        className="space-y-4 pt-2"
      >
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600" /> Attached Hardware
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
              {device?.components?.length || 0} components
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
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
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                        mainTablePage === pageNum
                          ? "bg-emerald-500 text-white shadow-md"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </div>
              <Button
                variant="ghost"
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

      {/* --- 5. MODAL CONNECTION LOGS (STATUS LOGS) --- */}
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
                  <div>
                    <h3 className="font-bold text-gray-800">
                      Node Connection Logs
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Riwayat koneksi hidup/mati node hardware
                    </p>
                  </div>
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

      {/* --- 6. MODAL SENSOR HISTORICAL LOG READINGS (POP-UP TABEL LOG) --- */}
      <AnimatePresence>
        {isLogModalOpen && modalSelectedComp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{opacity: 0, scale: 0.95, y: 20}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.95, y: 20}}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 ring-1 ring-emerald-100">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-900 tracking-tight">
                      Riwayat Log Sensor: {modalSelectedComp.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md font-bold uppercase">
                        {modalSelectedComp.category || "Sensor"}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">
                        • Satuan: {modalSelectedComp.unit || "N/A"}
                      </span>
                      {modalSensorPagination && (
                        <span className="text-[10px] text-gray-400">
                          (Total {modalSensorPagination.totalData} logs)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body: Data Table */}
              <div className="p-6 overflow-y-auto flex-grow bg-gray-50/40 custom-scrollbar">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
                  <Table
                    isLoading={isLoadingModalSensor}
                    columns={[
                      {
                        header: "Timestamp Waktu",
                        cell: (r: any) => {
                          const date = new Date(
                            r.createdAt || r.deviceTime || Date.now(),
                          );
                          return (
                            <div className="flex flex-col font-mono text-[11px]">
                              <span className="font-bold text-gray-800">
                                {date
                                  .toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                  })
                                  .replace(/\./g, ":")}
                              </span>
                              <span className="text-[9px] text-gray-400 uppercase font-sans">
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
                        header: "Nilai Terbaca",
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
                        header: "Status Data",
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
                    emptyMessage="Belum ada data log telemetri yang tercatat untuk sensor ini."
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
                      <Button
                        variant="ghost"
                        className={`h-8 w-8 p-0 rounded-lg bg-white border shadow-xs ${
                          modalSensorPage === 1
                            ? "opacity-40"
                            : "hover:bg-emerald-50"
                        }`}
                        disabled={modalSensorPage === 1}
                        onClick={() => setModalSensorPage((p) => p - 1)}
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        className={`h-8 w-8 p-0 rounded-lg bg-white border shadow-xs ${
                          modalSensorPage >= modalSensorPagination.totalPages
                            ? "opacity-40"
                            : "hover:bg-emerald-50"
                        }`}
                        disabled={
                          modalSensorPage >= modalSensorPagination.totalPages
                        }
                        onClick={() => setModalSensorPage((p) => p + 1)}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-5 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                >
                  Tutup
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

function StatPill({label, val, icon: Icon, color}: any) {
  return (
    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-xs">
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[9px] uppercase font-extrabold text-gray-400 tracking-wider">
          {label}
        </p>
        <p className="text-sm font-black text-gray-800 font-mono mt-0.5">
          {val}
        </p>
      </div>
    </div>
  );
}

