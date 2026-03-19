import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser, User } from "@workspace/api-client-react";
import { PageTransition, Card, Button, Input, Select, Badge } from "@/components/ui/PremiumComponents";
import { Plus, Edit, Trash2, Phone, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

const userSchema = z.object({
  username: z.string().min(3),
  fullName: z.string().min(1),
  password: z.string().optional(),
  role: z.enum(["admin", "driver"]),
  phone: z.string().optional(),
});

export default function Drivers() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users = [], refetch } = useListUsers();
  
  const createMutation = useCreateUser({ mutation: { onSuccess: () => { refetch(); setIsModalOpen(false); toast({title:"Success", description:"User created"}) } }});
  const updateMutation = useUpdateUser({ mutation: { onSuccess: () => { refetch(); setIsModalOpen(false); toast({title:"Success", description:"User updated"}) } }});
  const deleteMutation = useDeleteUser({ mutation: { onSuccess: () => { refetch(); toast({title:"Deleted", description:"User deleted"}) } }});

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: "", fullName: "", role: "driver", phone: "" },
  });

  const openCreate = () => {
    setEditingUser(null);
    form.reset({ username: "", fullName: "", role: "driver", phone: "", password: "" });
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone || "",
      password: "", // Optional for updates
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: z.infer<typeof userSchema>) => {
    if (editingUser) {
      const updateData = { ...data };
      if (!updateData.password) delete updateData.password;
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      if (!data.password) {
        toast({ title: "Error", description: "Password required for new users", variant: "destructive" });
        return;
      }
      createMutation.mutate({ data: data as any });
    }
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Users & Drivers</h1>
          <p className="text-muted-foreground mt-1">Manage platform access and driver profiles.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <Card key={u.id} className="p-6 flex flex-col hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-xl font-bold shadow-lg">
                {u.fullName.charAt(0)}
              </div>
              <Badge variant={u.role === 'admin' ? 'warning' : 'default'} className="uppercase">
                {u.role}
              </Badge>
            </div>
            <h3 className="text-lg font-display mb-1">{u.fullName}</h3>
            <p className="text-sm text-muted-foreground mb-4">@{u.username}</p>
            
            <div className="space-y-2 mt-auto">
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Phone className="w-4 h-4" /> {u.phone || "No phone added"}
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Shield className="w-4 h-4" /> Joined {format(new Date(u.createdAt), "MMM yyyy")}
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(u)}>Edit</Button>
              <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/20" onClick={() => confirm("Delete user?") && deleteMutation.mutate({ id: u.id })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-card border-white/20 shadow-2xl relative">
            <h2 className="text-xl font-display mb-6">{editingUser ? "Edit User" : "Add New User"}</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">Full Name</label>
                <Input {...form.register("fullName")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Username</label>
                <Input {...form.register("username")} disabled={!!editingUser} />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Password {editingUser && "(Leave blank to keep current)"}</label>
                <Input type="password" {...form.register("password")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Role</label>
                  <Select {...form.register("role")}>
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Phone</label>
                  <Input {...form.register("phone")} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                  Save User
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PageTransition>
  );
}
