import { useState } from "react";
import { useListTrips } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition, Card, Button } from "@/components/ui/PremiumComponents";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: trips = [] } = useListTrips({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = getDay(monthStart);
  const paddingDays = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }).map((_, i) => i);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-500/80",
    in_progress: "bg-yellow-500/80",
    completed: "bg-emerald-500/80",
    cancelled: "bg-red-500/80",
  };

  return (
    <PageTransition className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.calendarTitle}</h1>
          <p className="text-muted-foreground mt-1">{t.calendarSubtitle}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setLocation("/trips?new=true")} className="gap-2">
            <Plus className="w-4 h-4" /> {t.addTrip}
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-card/60">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-display capitalize">{format(currentDate, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-white/5 bg-white/5">
          {t.weekDays.map((day) => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 overflow-y-auto" style={{ gridAutoRows: "minmax(100px, 1fr)" }}>
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="border-b border-r border-white/5 bg-white/5 p-2" />
          ))}

          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayTrips = trips.filter((tr) => tr.date.startsWith(dateStr));
            const isCurrMonth = isSameMonth(day, monthStart);
            const today = isToday(day);

            return (
              <div
                key={day.toString()}
                className={`border-b border-r border-white/5 p-2 transition-colors hover:bg-white/5 cursor-pointer ${!isCurrMonth ? "opacity-30" : ""}`}
                onClick={() => setLocation(`/trips?date=${dateStr}`)}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                    today ? "bg-primary text-white" : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-1">
                  {dayTrips.slice(0, 3).map((trip) => (
                    <div
                      key={trip.id}
                      className={`truncate rounded px-1.5 py-0.5 text-xs text-white ${statusColors[trip.status] || "bg-primary/80"}`}
                      title={`${trip.origin} → ${trip.destination}`}
                    >
                      {trip.origin.split(" ")[0]} → {trip.destination.split(" ")[0]}
                    </div>
                  ))}
                  {dayTrips.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">+{dayTrips.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </PageTransition>
  );
}
