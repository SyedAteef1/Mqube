import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { apiFetchV1 } from "../lib/apiFetch.ts";
import { Product, Formula, PSVParty } from "../types";

import { InvForecastidget } from "./InventoryForecastW.tsx";
import { AuditActivityFeed } from "./AuditActivityFeed.tsx";
import { QuickReportsWidget } from "./QuickReportsWidget.tsx";

// Simple tooltip for the daily sales chart
const DailySalesTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-theme-divider rounded-lg px-3 py-2 shadow-md text-xs min-w-[150px]">
        <div className="font-semibold text-theme-body mb-1">{data.label}</div>
        <div className="flex justify-between gap-4 text-theme-muted">
          <span>Sales</span>
          <span className="font-semibold text-theme-body tabular-nums">
            ₹{Number(data.sales).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex justify-between gap-4 text-theme-muted">
          <span>Bills</span>
          <span className="font-semibold text-theme-body tabular-nums">{data.transactions}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Simple tooltip for the distributor stock chart
const DistributorStockTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as PSVParty;
    if (!data) return null;
    return (
      <div className="bg-white border border-theme-divider rounded-lg px-3 py-2 shadow-md text-xs min-w-[180px]">
        <div className="font-semibold text-theme-body">{data.name}</div>
        <div className="text-theme-muted mb-1">{data.location}</div>
        <div className="flex justify-between gap-4 text-theme-muted">
          <span>Stock</span>
          <span className="font-semibold text-theme-body tabular-nums">{data.stockCount}</span>
        </div>
        <div className="flex justify-between gap-4 text-theme-muted">
          <span>Sold</span>
          <span className="font-semibold text-theme-body tabular-nums">{data.sellThrough}%</span>
        </div>
      </div>
    );
  }
  return null;
};

// Opens another tab through the app's existing navigation event (handled in App.tsx)
const openModule = (moduleId: string) => {
  window.dispatchEvent(new CustomEvent("tileflow_navigate_module", { detail: { moduleId } }));
};

const QUICK_ACTIONS = [
  { id: "sales", label: "New bill", icon: "receipt_long", primary: true },
  { id: "pos", label: "Counter bill", icon: "point_of_sale" },
  { id: "purchase", label: "Receive stock", icon: "inventory" },
  { id: "stock-transfers", label: "Stock transfer", icon: "local_shipping" },
  { id: "item-master", label: "Add item", icon: "add_box" },
];

interface DashboardTabProps {
  products: Product[];
  formulas: Formula[];
  psvParties: PSVParty[];
  onSelectFormula: (f: Formula) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  products,
  formulas,
  psvParties,
  onSelectFormula,
}) => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Date range: default to All Time (empty range)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [taxRegisterReport, setTaxRegisterReport] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [liveStockValuation, setLiveStockValuation] = useState<any>(null);
  const [showMore, setShowMore] = useState<boolean>(false);

  // Fetch Live Tax Invoice Master Register & Stock Valuation from PostgreSQL backend
  useEffect(() => {
    let isMounted = true;
    async function fetchDashboardData() {
      setIsLoadingReport(true);
      try {
        let url = "/reports/tax-invoices-master-register";
        if (startDate && endDate) {
          url += `?from_date=${startDate}&to_date=${endDate}`;
        }
        const report = await apiFetchV1<any>(url);
        if (isMounted && report) {
          setTaxRegisterReport(report);
        }
      } catch (e) {
        console.error("Dashboard failed to fetch tax-invoices-master-register:", e);
      } finally {
        if (isMounted) setIsLoadingReport(false);
      }

      try {
        const val = await apiFetchV1<any>("/reports/stock-valuation");
        if (isMounted && val) {
          setLiveStockValuation(val);
        }
      } catch (e) {}
    }

    fetchDashboardData();
    return () => { isMounted = false; };
  }, [startDate, endDate]);

  // Derived real invoice lines from authoritative Tax Invoice Master Register
  const lines = React.useMemo(() => {
    return Array.isArray(taxRegisterReport?.lines) ? taxRegisterReport.lines : [];
  }, [taxRegisterReport]);

  const totalInvoicesCount = taxRegisterReport?.total_invoices ?? lines.length;
  const totalLiveSales = Number(taxRegisterReport?.total_grand_total ?? lines.reduce((sum: number, l: any) => sum + Number(l.grand_total || 0), 0));

  // Filter logs by date range selection for child widgets
  const filteredAuditLogs = React.useMemo(() => {
    if (!Array.isArray(auditLogs)) return [];
    return auditLogs.filter(log => {
      try {
        if (!log.timestamp) return true;
        const logDate = new Date(log.timestamp);
        if (isNaN(logDate.getTime())) return true;
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
        return true;
      } catch {
        return true;
      }
    });
  }, [auditLogs, startDate, endDate]);

  const scaleFactor = 1.0;

  const [chatMessage, setChatMessage] = useState("");
  const [chatReplies, setChatReplies] = useState<
    { sender: "user" | "ai"; text: string }[]
  >([
    {
      sender: "ai",
      text: "Hello! Ask me about your stock, slow-moving items, or sales.",
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const data = await apiFetchV1<any>("/audit-logs");
      const logsData = Array.isArray(data) ? data : data?.logs || [];
      setAuditLogs(logsData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  // Send AI message
  const handleSendMessage = async (msgText?: string) => {
    const textToSend = msgText || chatMessage;
    if (!textToSend.trim() || isSending) return;

    if (!msgText) setChatMessage("");

    setChatReplies((prev) => [...prev, { sender: "user", text: textToSend }]);
    setIsSending(true);

    try {
      const data = await apiFetchV1<any>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: textToSend,
          context: {
            stockStatus: products.map((p) => ({
              code: p.code,
              name: p.name,
              stock: p.stock,
            })),
            distributors: psvParties.map((p) => ({
              name: p.name,
              stock: p.stockCount,
              status: p.status,
            })),
          },
        }),
      });
      setChatReplies((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch {
      setChatReplies((prev) => [
        ...prev,
        { sender: "ai", text: "Error connecting to server-side AI reasoning." },
      ]);
    } finally {
      setIsSending(false);
      fetchAuditLogs();
    }
  };

  const stockValue = liveStockValuation
    ? Math.round(parseFloat(liveStockValuation.total_value || 0))
    : null;

  // Format INR Currencies
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const lowStockCount = products.filter((p) => p.stock < 15).length;

  // Group invoices by date to build true daily curves
  const salesByDate = React.useMemo(() => {
    const map = new Map<string, { date: string; label: string; sales: number; transactions: number; units: number }>();
    lines.forEach((l: any) => {
      const d = l.invoice_date || "2026-08-12";
      const existing = map.get(d) || {
        date: d,
        label: new Date(d).toLocaleDateString("en-IN", { month: "short", day: "2-digit" }),
        sales: 0,
        transactions: 0,
        units: 0
      };
      existing.sales += Number(l.grand_total || 0);
      existing.transactions += 1;
      existing.units += Number(l.total_quantity || 0);
      map.set(d, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [lines]);

  // Last 7 billing days within the selected period (real invoice records only)
  const salesLast7Days = React.useMemo(() => salesByDate.slice(-7), [salesByDate]);

  // ---- Presentation helpers (no effect on data fetching) ----
  const isoToday = new Date().toISOString().split("T")[0];
  const localToday = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split("T")[0];

  const periodPresets = [
    { key: "today", label: "Today", start: isoToday, end: isoToday },
    { key: "7d", label: "7 days", start: daysAgo(7), end: isoToday },
    { key: "30d", label: "30 days", start: daysAgo(30), end: isoToday },
    { key: "all", label: "All", start: "", end: "" },
  ];
  const activePreset = periodPresets.find((p) => p.start === startDate && p.end === endDate);
  const periodText =
    activePreset?.key === "today" ? "today"
    : activePreset?.key === "7d" ? "last 7 days"
    : activePreset?.key === "30d" ? "last 30 days"
    : activePreset?.key === "all" ? "all time"
    : "selected dates";
  const isTodayPeriod = activePreset?.key === "today";
  const periodIncludesToday = !endDate || endDate >= localToday || endDate >= isoToday;

  const todayLines = lines.filter((l: any) => String(l.invoice_date || "").slice(0, 10) === localToday);
  const todaySales = todayLines.reduce((sum: number, l: any) => sum + Number(l.grand_total || 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateText = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const tiles: { label: string; value: string; note: string; tone?: "warn" }[] = [
    {
      label: isTodayPeriod ? "Today's sales" : `Sales, ${periodText}`,
      value: formatCurrency(totalLiveSales),
      note: !isTodayPeriod && periodIncludesToday ? `${formatCurrency(todaySales)} today` : "Including GST",
    },
    {
      label: isTodayPeriod ? "Bills today" : `Bills, ${periodText}`,
      value: String(totalInvoicesCount),
      note: !isTodayPeriod && periodIncludesToday ? `${todayLines.length} today` : "Completed bills",
    },
    {
      label: "Stock value",
      value: stockValue !== null ? formatCurrency(stockValue) : "—",
      note: "Stock in hand, all locations",
    },
    {
      label: "Low-stock items",
      value: String(lowStockCount),
      note: "Items with less than 15 in stock",
      tone: lowStockCount > 0 ? "warn" : undefined,
    },
  ];

  return (
    <div className="space-y-4 text-theme-body">
      {/* Greeting + period */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-tight">{greeting}</h2>
          <p className="text-[13px] text-theme-muted">{dateText}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1" role="group" aria-label="Period">
            {periodPresets.map((p) => {
              const isActive = activePreset?.key === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setStartDate(p.start);
                    setEndDate(p.end);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer border ${
                    isActive
                      ? "bg-[#171717] border-[#171717] text-white"
                      : "bg-white border-theme-divider text-theme-muted hover:text-theme-body hover:border-[#d4d4d4]"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom range */}
          <div className="flex items-center gap-1.5 text-[13px] text-theme-muted">
            <input
              type="date"
              aria-label="From date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-theme-divider rounded-full px-3 py-1 text-[13px] text-theme-body focus:outline-none focus:border-[#a3a3a3] cursor-pointer"
            />
            <span>to</span>
            <input
              type="date"
              aria-label="To date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="bg-white border border-theme-divider rounded-full px-3 py-1 text-[13px] text-theme-body focus:outline-none focus:border-[#a3a3a3] cursor-pointer"
            />
            {isLoadingReport && (
              <span className="w-3 h-3 border-2 border-[#a3a3a3] border-t-transparent rounded-full animate-spin" aria-label="Loading" />
            )}
          </div>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-xl px-4 py-3 border border-theme-divider">
            <div className="text-[13px] text-theme-muted">{t.label}</div>
            <div className={`mt-1 text-2xl font-semibold tabular-nums ${t.tone === "warn" ? "text-[#b91c1c]" : "text-theme-body"}`}>
              {t.value}
            </div>
            <div className="mt-0.5 text-xs text-theme-muted">{t.note}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => openModule(a.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border transition-colors cursor-pointer ${
              a.primary
                ? "bg-[#171717] border-[#171717] text-white hover:bg-[#262626]"
                : "bg-white border-theme-divider text-theme-body hover:bg-[#f5f5f5]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      {/* Chart + Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-theme-divider" id="kpi-sales-growth-trend-widget">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-[15px] font-semibold">Sales — last 7 days</h3>
            <span className="text-xs text-theme-muted tabular-nums">
              {formatCurrency(salesLast7Days.reduce((sum, d) => sum + d.sales, 0))}
            </span>
          </div>
          <div className="h-56">
            {salesLast7Days.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[13px] text-theme-muted">
                No bills in this period yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesLast7Days} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="label" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#737373"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<DailySalesTooltip />} cursor={{ fill: "#f5f5f5" }} />
                  <Bar dataKey="sales" fill="#171717" radius={[4, 4, 0, 0]} maxBarSize={44} name="Sales" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <QuickReportsWidget
          products={products}
          psvParties={psvParties}
          auditLogs={filteredAuditLogs}
          startDate={startDate}
          endDate={endDate}
          scaleFactor={scaleFactor}
        />
      </div>

      {/* Everything else stays available, hidden by default */}
      <div>
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="inline-flex items-center gap-1 text-[13px] text-theme-muted hover:text-theme-body cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {showMore ? "expand_less" : "expand_more"}
          </span>
          {showMore ? "Show less" : "More: recent activity, stock forecast, distributors, assistant"}
        </button>
      </div>

      {showMore && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-4">
            {/* Recent changes (audit log) */}
            <div className="bg-white rounded-xl p-4 border border-theme-divider">
              <h3 className="text-[15px] font-semibold mb-3">Recent changes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] text-theme-muted">
                  <thead className="text-xs text-theme-muted border-b border-theme-divider">
                    <tr>
                      <th className="px-3 py-2 font-medium">Time</th>
                      <th className="px-3 py-2 font-medium">User</th>
                      <th className="px-3 py-2 font-medium">Action</th>
                      <th className="px-3 py-2 font-medium">Before</th>
                      <th className="px-3 py-2 font-medium">After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-divider">
                    {auditLogs.slice(0, 5).map((log) => (
                      <tr key={log.id}>
                        <td className="px-3 py-2 text-xs tabular-nums">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-3 py-2 text-theme-body">{log.user}</td>
                        <td className="px-3 py-2">
                          <div className="text-theme-body">{log.action}</div>
                          <div className="text-xs text-theme-muted">{log.details}</div>
                        </td>
                        <td className="px-3 py-2 text-xs">{log.before}</td>
                        <td className="px-3 py-2 text-xs">{log.after}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-theme-muted">No recent changes.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {psvParties.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-theme-divider">
                <h3 className="text-[15px] font-semibold mb-3">Stock with distributors</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={psvParties} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#e5e5e5" />
                      <XAxis
                        dataKey="name"
                        stroke="#737373"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => String(val).split(" ")[0]}
                      />
                      <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<DistributorStockTooltip />} cursor={{ fill: "#f5f5f5" }} />
                      <Bar dataKey="stockCount" fill="#171717" radius={[4, 4, 0, 0]} name="Stock Units" />
                      <Bar dataKey="sellThrough" fill="#a3a3a3" radius={[4, 4, 0, 0]} name="Sell-Through %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="h-80"><InvForecastidget /></div>
          </div>

          <div className="space-y-4">
            <AuditActivityFeed />

            {/* Assistant */}
            <div className="bg-white rounded-xl border border-theme-divider flex flex-col h-[420px]">
              <div className="px-4 py-3 border-b border-theme-divider">
                <h4 className="text-[15px] font-semibold">Assistant</h4>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 text-[13px]">
                {chatReplies.map((reply, i) => (
                  <div
                    key={i}
                    className={`flex ${reply.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${
                        reply.sender === "user"
                          ? "bg-[#171717] text-white"
                          : "bg-[#f5f5f5] text-theme-body whitespace-pre-wrap leading-relaxed"
                      }`}
                    >
                      {reply.text}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="text-xs text-theme-muted">Thinking…</div>
                )}
              </div>

              <div className="p-3 border-t border-theme-divider flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Ask about stock or sales…"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 bg-white border border-theme-divider text-theme-body text-sm px-3 py-1.5 rounded-full focus:outline-none focus:border-[#a3a3a3]"
                  disabled={isSending}
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  aria-label="Send"
                  className="bg-[#171717] hover:bg-[#262626] text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  disabled={isSending}
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
