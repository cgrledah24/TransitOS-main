import { useState } from "react";
import { useListTrips, useListUsers, useCreateTrip, useUpdateTrip, useDeleteTrip, Trip } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { PageTransition, Card, Button, Badge, Input, Select } from "@/components/ui/PremiumComponents";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Search, Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

export default function Trips() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const tripSchema = z.object({
    date: z.string().min(1),
    origin: z.string().min(1),
    destination: z.string().min(1),
    driverId: z.coerce.number().min(1),
    amount: z.coerce.number().optional(),
    notes: z.string().optional(),
    status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  });

  const { data: trips = [], refetch } = useListTrips();
  const { data: drivers = [] } = useListUsers({ query: { enabled: isAdmin } });

  const createMutation = useCreateTrip({ mutation: { onSuccess: () => { refetch(); setIsModalOpen(false); toast({ title: t.tripCreated }) } } });
  const updateMutation = useUpdateTrip({ mutation: { onSuccess: () => { refetch(); setIsModalOpen(false); toast({ title: t.tripUpdated }) } } });
  const deleteMutation = useDeleteTrip({ mutation: { onSuccess: () => { refetch(); toast({ title: t.tripDeleted }) } } });

  const form = useForm<z.infer<typeof tripSchema>>({
    resolver: zodResolver(tripSchema),
    defaultValues: { date: format(new Date(), "yyyy-MM-dd"), origin: "", destination: "", amount: 0, status: "scheduled", notes: "" },
  });

  const openEdit = (trip: Trip) => {
    setEditingTrip(trip);
    form.reset({
      date: trip.date.split("T")[0],
      origin: trip.origin,
      destination: trip.destination,
      driverId: trip.driverId,
      amount: trip.amount || 0,
      status: trip.status as any,
      notes: trip.notes || "",
    });
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingTrip(null);
    form.reset({ date: format(new Date(), "yyyy-MM-dd"), origin: "", destination: "", amount: 0, status: "scheduled", notes: "" });
    setIsModalOpen(true);
  };

  const onSubmit = (data: z.infer<typeof tripSchema>) => {
    if (editingTrip) updateMutation.mutate({ id: editingTrip.id, data });
    else createMutation.mutate({ data: data as any });
  };

  const filteredTrips = trips.filter((tr) =>
    tr.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusLabel: Record<string, string> = {
    scheduled: t.scheduled,
    in_progress: t.inProgress,
    completed: t.completed,
    cancelled: t.cancelled,
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.tripsTitle}</h1>
          <p className="text-muted-foreground mt-1">{isAdmin ? t.tripsSubtitleAdmin : t.tripsSubtitleDriver}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              className="pl-9 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button onClick={openCreate} className="h-11">
              <Plus className="w-4 h-4 mr-2" /> {t.newTrip}
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10 uppercase text-xs font-semibold text-muted-foreground">
            <tr>
              <th className="px-6 py-4">{t.date}</th>
              <th className="px-6 py-4">{t.origin} → {t.destination}</th>
              <th className="px-6 py-4">{t.driver}</th>
              <th className="px-6 py-4">{t.status}</th>
              <th className="px-6 py-4">{t.amount}</th>
              {isAdmin && <th className="px-6 py-4 text-right">{t.actions}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredTrips.map((trip) => (
              <tr key={trip.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {format(new Date(trip.date + "T00:00:00"), "dd MMM yyyy")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{trip.origin} <span className="text-muted-foreground mx-1">→</span> {trip.destination}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{trip.driverName || "—"}</td>
                <td className="px-6 py-4">
                  <Badge variant={trip.status === "completed" ? "success" : trip.status === "in_progress" ? "warning" : "default"}>
                    {statusLabel[trip.status] || trip.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 font-medium">{trip.amount ? formatCurrency(trip.amount) : "—"}</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(trip)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => confirm(`${t.delete}?`) && deleteMutation.mutate({ id: trip.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredTrips.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">{t.noTrips}</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-6 bg-card border-white/20 shadow-2xl">
            <h2 className="text-xl font-display mb-6">{editingTrip ? t.edit : t.newTrip}</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">{t.date}</label>
                  <Input type="date" {...form.register("date")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">{t.status}</label>
                  <Select {...form.register("status")}>
                    <option value="scheduled">{t.scheduled}</option>
                    <option value="in_progress">{t.inProgress}</option>
                    <option value="completed">{t.completed}</option>
                    <option value="cancelled">{t.cancelled}</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">{t.origin}</label>
                  <Input {...form.register("origin")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">{t.destination}</label>
                  <Input {...form.register("destination")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">{t.driver}</label>
                  <Select {...form.register("driverId")}>
                    <option value="">{t.selectDriver}</option>
                    {drivers.filter((d) => d.role === "driver").map((d) => (
                      <option key={d.id} value={d.id}>{d.fullName}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm">{t.amount}</label>
                  <Input type="number" step="0.01" {...form.register("amount")} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm">{t.notes}</label>
                <Input {...form.register("notes")} />
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>{t.cancel}</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                  {t.save}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PageTransition>
  );
}
