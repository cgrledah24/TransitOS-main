import { useGetTripStats, useListTrips, useUpdateTrip, Trip } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { PageTransition, Card } from "@/components/ui/PremiumComponents";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  TrendingUp, Truck, DollarSign, CheckCircle, Calendar,
  PlayCircle, CheckCircle2, Loader2, X, XCircle, MapPin, User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}

type TripStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

function TripDetailModal({
  trip,
  isAdmin,
  updatingId,
  onClose,
  onStatusChange,
}: {
  trip: Trip;
  isAdmin: boolean;
  updatingId: number | null;
  onClose: () => void;
  onStatusChange: (tripId: number, newStatus: TripStatus) => void;
}) {
  const { t } = useLanguage();
  const isUpdating = updatingId === trip.id;

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const statusLabel: Record<string, string> = {
    scheduled: t.scheduled,
    in_progress: t.inProgress,
    completed: t.completed,
    cancelled: t.cancelled,
  };

  const driverTransitions: Record<string, TripStatus[]> = {
    scheduled: ["in_progress"],
    in_progress: ["completed"],
    completed: [],
    cancelled: [],
  };
  const adminTransitions: Record<string, TripStatus[]> = {
    scheduled: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  const transitions = isAdmin
    ? adminTransitions[trip.status] ?? []
    : driverTransitions[trip.status] ?? [];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="p-6 bg-card border-white/20 shadow-2xl">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.tripDetails}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(trip.date + "T00:00:00"), "d MMM yyyy")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-5">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[trip.status] || ""}`}>
              {statusLabel[trip.status] || trip.status}
            </span>
          </div>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t.origin} → {t.destination}</p>
                <p className="font-medium text-foreground">{trip.origin} <span className="text-muted-foreground">→</span> {trip.destination}</p>
              </div>
            </div>

            {trip.driverName && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <User className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t.driver}</p>
                  <p className="font-medium text-foreground">{trip.driverName}</p>
                </div>
              </div>
            )}

            {trip.amount != null && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t.amount}</p>
                  <p className="font-semibold text-emerald-400">{formatCurrency(trip.amount)}</p>
                </div>
              </div>
            )}

            {trip.notes && (
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-muted-foreground mb-1">{t.notes}</p>
                <p className="text-foreground">{trip.notes}</p>
              </div>
            )}
          </div>

          {transitions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {transitions.includes("in_progress") && (
                <button
                  onClick={() => onStatusChange(trip.id, "in_progress")}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2.5 text-sm font-semibold text-yellow-400 transition-all hover:bg-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  {t.startTrip}
                </button>
              )}
              {transitions.includes("completed") && (
                <button
                  onClick={() => onStatusChange(trip.id, "completed")}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {t.completeTrip}
                </button>
              )}
              {isAdmin && transitions.includes("cancelled") && (
                <button
                  onClick={() => onStatusChange(trip.id, "cancelled")}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  {t.cancelTrip}
                </button>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
              {t.close}
            </button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const { data: stats, refetch: refetchStats } = useGetTripStats(
    { year, month },
    { query: { refetchInterval: 60000 } }
  );
  const { data: allStats } = useGetTripStats(
    { year },
    { query: { refetchInterval: 60000 } }
  );
  const { data: trips = [], refetch: refetchTrips } = useListTrips(
    { year, month },
    { query: { refetchInterval: 60000 } }
  );

  const updateTripMutation = useUpdateTrip();

  const handleStatusChange = (tripId: number, newStatus: TripStatus) => {
    setUpdatingId(tripId);
    updateTripMutation.mutate(
      { id: tripId, data: { status: newStatus } },
      {
        onSuccess: () => {
          setUpdatingId(null);
          setSelectedTrip((prev) =>
            prev?.id === tripId ? { ...prev, status: newStatus } : prev
          );
          refetchTrips();
          refetchStats();
          toast({ title: "✓ " + t.statusUpdated, description: t.tripStatusChanged });
        },
        onError: (err: any) => {
          setUpdatingId(null);
          const msg = err?.response?.data?.message || err?.message || "Error al actualizar";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const upcomingTrips = trips
    .filter((tr) => tr.status === "scheduled" || tr.status === "in_progress")
    .slice(0, 8);

  const driverChartData = (stats?.byDriver || []).map((d) => ({
    name: d.driverName.split(" ")[0],
    [t.trips]: d.tripCount,
  }));

  const monthlyData = (allStats?.byMonth || []).map((m) => ({
    mes: m.month.slice(5),
    [t.revenueThisMonth]: m.totalAmount,
  }));

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const statusLabel: Record<string, string> = {
    scheduled: t.scheduled,
    in_progress: t.inProgress,
    completed: t.completed,
    cancelled: t.cancelled,
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.dashboard}</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? t.dashboardSubtitleAdmin : t.dashboardSubtitleDriver} — {format(now, "MMMM yyyy")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Truck} label={isAdmin ? t.tripsThisMonth : t.myTrips} value={String(stats?.totalTrips ?? 0)} color="bg-blue-600" />
          <StatCard icon={DollarSign} label={isAdmin ? t.revenueThisMonth : t.myRevenue} value={formatCurrency(stats?.totalRevenue ?? 0)} color="bg-emerald-600" />
          <StatCard icon={CheckCircle} label={t.completed} value={String(stats?.completedTrips ?? 0)} color="bg-violet-600" />
          <StatCard icon={Calendar} label={t.scheduled} value={String(stats?.scheduledTrips ?? 0)} color="bg-orange-600" />
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                {t.tripsByDriver}
              </h3>
              {driverChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={driverChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "hsl(var(--foreground))" }} />
                    <Bar dataKey={t.trips} fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">{t.noData}</div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t.monthlyRevenue} ({year})
              </h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [formatCurrency(value), t.revenueThisMonth]} />
                    <Line type="monotone" dataKey={t.revenueThisMonth} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">{t.noData}</div>
              )}
            </Card>
          </div>
        )}

        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            {isAdmin ? t.upcomingTrips : t.myUpcomingTrips}
          </h3>
          {upcomingTrips.length > 0 ? (
            <div className="divide-y divide-border/30">
              <AnimatePresence initial={false}>
                {upcomingTrips.map((trip) => {
                  const isUpdating = updatingId === trip.id;
                  return (
                    <motion.div
                      key={trip.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 cursor-pointer hover:bg-white/3 rounded-xl px-2 -mx-2 transition-colors group"
                      onClick={() => setSelectedTrip(trip)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          trip.status === "in_progress" ? "bg-yellow-500/15" : "bg-primary/10"
                        }`}>
                          <Truck className={`h-4 w-4 ${trip.status === "in_progress" ? "text-yellow-400" : "text-primary"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {trip.origin} → {trip.destination}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(trip.date + "T00:00:00"), "d MMM yyyy")}
                            {isAdmin && trip.driverName ? ` · ${trip.driverName}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-12 sm:ml-0 flex-wrap">
                        {trip.amount != null && (
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(trip.amount)}
                          </span>
                        )}
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${statusColors[trip.status] || ""}`}>
                          {statusLabel[trip.status] || trip.status}
                        </span>
                        {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">{t.noUpcomingTrips}</p>
          )}
        </Card>
      </div>

      <AnimatePresence>
        {selectedTrip && (
          <TripDetailModal
            trip={selectedTrip}
            isAdmin={isAdmin}
            updatingId={updatingId}
            onClose={() => setSelectedTrip(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
