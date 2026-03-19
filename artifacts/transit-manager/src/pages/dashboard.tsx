import { useGetTripStats, useListTrips } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { PageTransition, Card } from "@/components/ui/PremiumComponents";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import { TrendingUp, Truck, DollarSign, CheckCircle, Calendar } from "lucide-react";

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

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: stats } = useGetTripStats({ year, month });
  const { data: allStats } = useGetTripStats({ year });
  const { data: trips = [] } = useListTrips({ year, month });

  const upcomingTrips = trips
    .filter((t) => t.status === "scheduled" || t.status === "in_progress")
    .slice(0, 5);

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
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
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
          <h3 className="mb-4 font-semibold text-foreground">{isAdmin ? t.upcomingTrips : t.myUpcomingTrips}</h3>
          {upcomingTrips.length > 0 ? (
            <div className="divide-y divide-border/30">
              {upcomingTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{trip.origin} → {trip.destination}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(trip.date + "T00:00:00"), "d MMM yyyy")}
                        {isAdmin && trip.driverName ? ` · ${trip.driverName}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {trip.amount != null && <span className="text-sm font-semibold text-foreground">{formatCurrency(trip.amount)}</span>}
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[trip.status] || ""}`}>
                      {statusLabel[trip.status] || trip.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">{t.noUpcomingTrips}</p>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
