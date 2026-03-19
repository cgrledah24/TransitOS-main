import { useState } from "react";
import { useListTrips } from "@workspace/api-client-react";
import { PageTransition, Card, Button, Badge } from "@/components/ui/PremiumComponents";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [, setLocation] = useLocation();

  const { data: trips = [] } = useListTrips({
    query: {
      queryKey: ["/api/trips", { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1 }]
    }
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = monthStart;
  const endDate = monthEnd;

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Pad beginning of month
  const startDay = getDay(monthStart);
  const paddingDays = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }).map((_, i) => i);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <PageTransition className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Calendar</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage transport trips.</p>
        </div>
        <Button onClick={() => setLocation("/trips?new=true")} className="gap-2">
          <Plus className="w-4 h-4" /> Add Trip
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-card/60">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-display">{format(currentDate, dateFormat)}</h2>
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
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="border-b border-r border-white/5 bg-white/5 p-2" />
          ))}
          
          {days.map((day, i) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayTrips = trips.filter(t => t.date.startsWith(dateStr));
            const isCurrMonth = isSameMonth(day, monthStart);
            
            return (
              <div 
                key={day.toString()} 
                className={`border-b border-r border-white/5 p-2 transition-colors hover:bg-white/5 cursor-pointer min-h-[120px] ${!isCurrMonth ? 'opacity-30' : ''}`}
                onClick={() => setLocation(`/trips?date=${dateStr}`)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                    {format(day, "d")}
                  </span>
                  {dayTrips.length > 0 && (
                    <span className="text-xs text-muted-foreground font-medium">{dayTrips.length} trips</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayTrips.slice(0, 3).map(trip => (
                    <div key={trip.id} className="text-xs p-1.5 rounded bg-primary/20 text-blue-300 truncate border border-primary/20">
                      {trip.origin} → {trip.destination}
                    </div>
                  ))}
                  {dayTrips.length > 3 && (
                    <div className="text-xs text-center text-muted-foreground mt-1 font-medium">
                      +{dayTrips.length - 3} more
                    </div>
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
