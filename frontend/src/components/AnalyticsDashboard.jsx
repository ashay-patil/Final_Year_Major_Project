import React, { useEffect, useState } from "react";
import {
  Users,
  UserMinus,
  Clock,
  Bed,
  Brain,
  Lightbulb,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL = "http://localhost:8000";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06d6a0",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
  "#f97316",
  "#84cc16",
];

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    overview: null,
    insights: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [overviewResponse, insightsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/analytics/overview`),
          fetch(`${API_BASE_URL}/api/analytics/insights`),
        ]);

        if (!overviewResponse.ok) {
          throw new Error(
            `Overview API failed: ${overviewResponse.status}`
          );
        }

        if (!insightsResponse.ok) {
          throw new Error(
            `Insights API failed: ${insightsResponse.status}`
          );
        }

        const overviewJson = await overviewResponse.json();
        const insightsJson = await insightsResponse.json();

        /*
         * Backend response:
         *
         * {
         *   total_patients: 10,
         *   discharged_count: 1,
         *   avg_length_of_stay: 328.1,
         *   bed_occupancy_rate: 1.8,
         *   diagnosis_distribution: [
         *      { name, count, percentage }
         *   ],
         *   discharge_trends: [
         *      { date, count }
         *   ],
         *   workflow_timing: {...},
         *   status_breakdown: [
         *      { status, count }
         *   ],
         *   avg_los_by_diagnosis: [
         *      { diagnosis, avg_days }
         *   ]
         * }
         *
         * Convert it here into the shape expected by the UI.
         */

        const overview = {
          kpis: {
            totalPatients: overviewJson.total_patients ?? 0,
            dischargedToday: overviewJson.discharged_count ?? 0,
            avgStay: overviewJson.avg_length_of_stay ?? 0,
            occupancyRate: overviewJson.bed_occupancy_rate ?? 0,
          },

          dischargeTrends: (overviewJson.discharge_trends ?? []).map(
            (item) => ({
              name: item.date,
              count: item.count ?? 0,
            })
          ),

          diagnoses: (overviewJson.diagnosis_distribution ?? []).map(
            (item) => ({
              name: item.name,
              value: item.count ?? 0,
              percentage: item.percentage ?? 0,
            })
          ),

          stayByDiagnosis: (overviewJson.avg_los_by_diagnosis ?? []).map(
            (item) => ({
              name: item.diagnosis,
              days: item.avg_days ?? 0,
            })
          ),

          status: (overviewJson.status_breakdown ?? []).map((item) => ({
            name: item.status,
            value: item.count ?? 0,
          })),

          workflowTiming: overviewJson.workflow_timing ?? {
            avg_doctor_to_nurse: "0 mins",
            avg_nurse_to_pharmacy: "0 mins",
            avg_total: "0 mins",
          },
        };

        /*
         * Backend returns:
         * {
         *   "insights": ["...", "..."]
         * }
         *
         * So we need insightsJson.insights, not insightsJson itself.
         */
        const insights = Array.isArray(insightsJson.insights)
          ? insightsJson.insights
          : [];

        setData({
          overview,
          insights,
        });
      } catch (err) {
        console.error("Analytics dashboard error:", err);
        setError(err.message || "Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="bg-[#0f172a]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
        {label && (
          <p className="text-gray-400 text-xs font-semibold uppercase mb-1">
            {label}
          </p>
        )}

        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-white text-sm font-medium flex items-center gap-2"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-[#0a0e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-400 font-medium animate-pulse">
            Loading Analytics Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-[#0a0e1a] text-white">
        <div className="max-w-3xl mx-auto mt-20 bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-red-400 mb-2">
            Failed to load analytics
          </h2>

          <p className="text-gray-300 mb-4">{error}</p>

          <p className="text-gray-400 text-sm">
            Make sure your backend is running on{" "}
            <span className="text-white">
              http://localhost:8000
            </span>
            .
          </p>
        </div>
      </div>
    );
  }

  const { overview, insights } = data;

  return (
    <div className="min-h-screen p-8 bg-[#0a0e1a] text-white font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Hospital Analytics
          </h1>

          <p className="text-gray-400 mt-1">
            Real-time overview of hospital operations and patient metrics.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Patients",
              val: overview.kpis.totalPatients,
              icon: Users,
              color: "text-blue-400",
              border: "border-t-blue-500",
              bg: "from-blue-500/10",
            },
            {
              title: "Discharged",
              val: overview.kpis.dischargedToday,
              icon: UserMinus,
              color: "text-emerald-400",
              border: "border-t-emerald-500",
              bg: "from-emerald-500/10",
            },
            {
              title: "Avg Length of Stay",
              val: `${overview.kpis.avgStay} days`,
              icon: Clock,
              color: "text-amber-400",
              border: "border-t-amber-500",
              bg: "from-amber-500/10",
            },
            {
              title: "Bed Occupancy",
              val: `${overview.kpis.occupancyRate}%`,
              icon: Bed,
              color: "text-purple-400",
              border: "border-t-purple-500",
              bg: "from-purple-500/10",
            },
          ].map((kpi) => (
            <div
              key={kpi.title}
              className={`bg-gradient-to-br ${kpi.bg} to-white/5 border border-white/10 ${kpi.border} border-t-2 rounded-2xl p-6 backdrop-blur-xl shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    {kpi.title}
                  </p>

                  <p className="text-3xl font-bold text-white mt-2">
                    {kpi.val}
                  </p>
                </div>

                <div className={`p-3 rounded-xl bg-white/5 ${kpi.color}`}>
                  <kpi.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Workflow Timing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              Doctor → Nurse
            </p>
            <p className="text-2xl font-bold mt-2">
              {overview.workflowTiming.avg_doctor_to_nurse}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              Nurse → Pharmacy
            </p>
            <p className="text-2xl font-bold mt-2">
              {overview.workflowTiming.avg_nurse_to_pharmacy}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              Total Workflow
            </p>
            <p className="text-2xl font-bold mt-2">
              {overview.workflowTiming.avg_total}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Discharge Trends */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-6">
              Discharge Trends
            </h3>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview.dischargeTrends}>
                  <defs>
                    <linearGradient
                      id="colorCount"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.5}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    stroke="#6b7280"
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Discharges"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Diagnosis Distribution */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-6">
              Diagnosis Distribution
            </h3>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overview.diagnoses}
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {overview.diagnoses.map((entry, index) => (
                      <Cell
                        key={`diagnosis-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip content={<CustomTooltip />} />

                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average LOS by Diagnosis */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-6">
              Avg Length of Stay by Diagnosis
            </h3>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={overview.stayByDiagnosis}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 20,
                    left: 100,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    stroke="#9ca3af"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    dataKey="days"
                    name="Avg Days"
                    fill="#14b8a6"
                    radius={[0, 4, 4, 0]}
                  >
                    {overview.stayByDiagnosis.map((entry, index) => (
                      <Cell
                        key={`los-${index}`}
                        fill={COLORS[(index + 2) % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Patient Status */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-6">
              Patient Status Overview
            </h3>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overview.status}
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {overview.status.map((entry, index) => (
                      <Cell
                        key={`status-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip content={<CustomTooltip />} />

                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400">
              <Brain size={24} />
            </div>

            <h2 className="text-xl font-bold text-white">
              AI Operations Insights
            </h2>
          </div>

          <div className="space-y-4">
            {insights.length === 0 ? (
              <p className="text-gray-400">
                No insights available.
              </p>
            ) : (
              insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-xl bg-black/20 border border-white/5"
                >
                  <div className="mt-0.5 text-amber-400">
                    <Lightbulb size={20} />
                  </div>

                  <p className="text-gray-300 text-sm leading-relaxed">
                    {insight}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;