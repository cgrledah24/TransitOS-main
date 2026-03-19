import { useState } from "react";
import { useListTrips, useListUsers, useCreateTrip, useUpdateTrip, useDeleteTrip, Trip } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition, Card, Button, Badge, Input, Select } from "@/components/ui/PremiumComponents";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Search, Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const tripSchema = z.object({
  date: z.string().min(1, "Date is required"),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  driverId: z.coerce.number().min(1, "Driver is required"),
  amount: z.coerce.number().optional(),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
});

export default function Trips() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const { data: trips = [], refetch } = useListTrips();
  const { data: drivers = [] } = useListUsers({ query: { enabled: isAdmin } });

  const createMutation = useCreateTrip({ mutation: { onSuccess: () => { refetch(); setIsModalOpen(false); toast({title:"Success", description:"Trip created"}) } }});
  const updateMutation = useUpdateTrip({ mutation: { onSuccess: () => { refetch(); setIsModalOpen(false); toast({title:"Success", description:"Trip updated"}) } }});
  const deleteMutation = useDeleteTrip({ mutation: { onSuccess: () => { refetch(); toast({title:"Deleted", description:"Trip deleted"}) } }});

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

  const filteredTrips = trips.filter(t => 
    t.origin.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl">Trips</h1>
          <p className="text-muted-foreground mt-1">Manage all transport operations.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search origin, destination..." 
              className="pl-9 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button onClick={openCreate} className="h-11">
              <Plus className="w-4 h-4 mr-2" /> New Trip
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10 uppercase text-xs font-semibold text-muted-foreground">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Route</th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Amount</th>
              {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredTrips.map(trip => (
              <tr key={trip.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{format(new Date(trip.date), "MMM dd, yyyy")}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{trip.origin} <span className="text-muted-foreground mx-1">→</span> {trip.destination}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{trip.driverName || "Unassigned"}</td>
                <td className="px-6 py-4">
                  <Badge variant={trip.status === 'completed' ? 'success' : trip.status === 'in_progress' ? 'warning' : 'default'}>
                    {trip.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-6 py-4 font-medium">{trip.amount ? formatCurrency(trip.amount) : "-"}</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(trip)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/20 hover:text-destructive" onClick={() => confirm("Delete this trip?") && deleteMutation.mutate({ id: trip.id })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredTrips.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No trips found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Custom Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-6 bg-card border-white/20 shadow-2xl relative">
            <h2 className="text-xl font-display mb-6">{editingTrip ? "Edit Trip" : "Create New Trip"}</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Date</label>
                  <Input type="date" {...form.register("date")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Status</label>
                  <Select {...form.register("status")}>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Origin</label>
                  <Input {...form.register("origin")} placeholder="City or Address" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Destination</label>
                  <Input {...form.register("destination")} placeholder="City or Address" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Driver</label>
                  <Select {...form.register("driverId")}>
                    <option value="">Select Driver...</option>
                    {drivers.filter(d => d.role === "driver").map(d => (
                      <option key={d.id} value={d.id}>{d.fullName}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Amount ($)</label>
                  <Input type="number" step="0.01" {...form.register("amount")} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm">Notes</label>
                <Input {...form.register("notes")} placeholder="Optional notes" />
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                  {editingTrip ? "Save Changes" : "Create Trip"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PageTransition>
  );
}
