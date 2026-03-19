import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser, User } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { PageTransition, Card, Button, Input, Select, Badge } from "@/components/ui/PremiumComponents";
import { Plus, Trash2, Phone, Shield, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const userSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  password: z.string().optional(),
  role: z.enum(["admin", "driver"]),
  phone: z.string().optional(),
});

const createSchema = userSchema.extend({
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .regex(/[a-zA-Z]/, "Debe contener al menos una letra")
    .regex(/[0-9]/, "Debe contener al menos un número"),
});

const editSchema = userSchema.extend({
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || (val.length >= 6 && /[a-zA-Z]/.test(val) && /[0-9]/.test(val)),
      { message: "Si cambia la contraseña, debe tener mínimo 6 caracteres, una letra y un número" }
    ),
});

type FormData = z.infer<typeof editSchema>;

interface ModalState {
  open: boolean;
  result: "idle" | "success" | "error";
  message: string;
}

export default function Drivers() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false, result: "idle", message: "" });

  const { data: users = [], refetch } = useListUsers();

  const form = useForm<FormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { username: "", fullName: "", role: "driver", phone: "", password: "" },
  });

  const resetModal = (user: User | null = null) => {
    setEditingUser(user);
    setModal({ open: true, result: "idle", message: "" });
    if (user) {
      form.reset({ username: user.username, fullName: user.fullName, role: user.role, phone: user.phone || "", password: "" });
    } else {
      form.reset({ username: "", fullName: "", role: "driver", phone: "", password: "" });
    }
  };

  const closeModal = () => setModal({ open: false, result: "idle", message: "" });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        refetch();
        setModal({ open: false, result: "idle", message: "" });
        toast({ title: "✓ " + t.driverCreated });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Error al crear el usuario";
        setModal((prev) => ({ ...prev, result: "error", message: msg }));
      },
    },
  });

  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: (data: any) => {
        refetch();
        setModal({ open: false, result: "idle", message: "" });
        toast({
          title: "✓ " + t.driverUpdated,
          description: `${data?.fullName ?? ""} ${t.driverUpdated.toLowerCase()}`,
        });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Error al actualizar el usuario";
        setModal((prev) => ({ ...prev, result: "error", message: msg }));
      },
    },
  });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        refetch();
        toast({ title: "✓ " + t.driverDeleted });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Error al eliminar el usuario";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  const onSubmit = (data: FormData) => {
    setModal((prev) => ({ ...prev, result: "idle", message: "" }));

    if (editingUser) {
      const updateData: Record<string, any> = {
        fullName: data.fullName,
        role: data.role,
        phone: data.phone,
      };
      if (data.password) updateData.password = data.password;
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      if (!data.password) {
        setModal((prev) => ({ ...prev, result: "error", message: t.passwordRequired }));
        return;
      }
      const parsed = createSchema.safeParse(data);
      if (!parsed.success) {
        setModal((prev) => ({ ...prev, result: "error", message: parsed.error.issues[0]?.message || "Error de validación" }));
        return;
      }
      createMutation.mutate({ data: data as any });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.driversTitle}</h1>
          <p className="text-muted-foreground mt-1">{t.driversSubtitle}</p>
        </div>
        <Button onClick={() => resetModal()} className="gap-2">
          <Plus className="w-4 h-4" /> {t.newDriver}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <Card key={u.id} className="p-6 flex flex-col hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-xl font-bold shadow-lg">
                {u.fullName.charAt(0)}
              </div>
              <Badge variant={u.role === "admin" ? "warning" : "default"} className="uppercase">
                {u.role === "admin" ? t.admin : t.driverRole}
              </Badge>
            </div>
            <h3 className="text-lg font-display mb-1">{u.fullName}</h3>
            <p className="text-sm text-muted-foreground mb-4">@{u.username}</p>
            <div className="space-y-2 mt-auto">
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Phone className="w-4 h-4" /> {u.phone || "—"}
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Shield className="w-4 h-4" /> {format(new Date(u.createdAt), "MMM yyyy")}
              </div>
            </div>
            <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => resetModal(u)}>
                {t.edit}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:bg-destructive/20"
                onClick={() => confirm(`${t.delete} ${u.fullName}?`) && deleteMutation.mutate({ id: u.id })}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
        {users.length === 0 && (
          <p className="col-span-3 text-center text-muted-foreground py-12">{t.noDrivers}</p>
        )}
      </div>

      <AnimatePresence>
        {modal.open && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              key="modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Card className="w-full max-w-md p-6 bg-card border-white/20 shadow-2xl">
                <h2 className="text-xl font-display mb-5">
                  {editingUser ? `${t.edit}: ${editingUser.fullName}` : t.newDriver}
                </h2>

                {/* Inline result banner */}
                <AnimatePresence>
                  {modal.result !== "idle" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`flex items-start gap-3 rounded-xl px-4 py-3 mb-4 text-sm font-medium border ${
                        modal.result === "success"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-destructive/10 border-destructive/30 text-red-400"
                      }`}
                    >
                      {modal.result === "success" ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      )}
                      <span>{modal.message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">{t.fullName}</label>
                    <Input {...form.register("fullName")} />
                    {form.formState.errors.fullName && (
                      <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Username (disabled in edit mode) */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">{t.username}</label>
                    <Input {...form.register("username")} disabled={!!editingUser} className={editingUser ? "opacity-50 cursor-not-allowed" : ""} />
                    {form.formState.errors.username && (
                      <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      {t.password}{" "}
                      {editingUser && (
                        <span className="text-muted-foreground text-xs font-normal">(dejar vacío para no cambiar)</span>
                      )}
                    </label>
                    <Input type="password" {...form.register("password")} placeholder="••••••••" />
                    {form.formState.errors.password && (
                      <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                    )}
                    {!editingUser && (
                      <p className="text-xs text-muted-foreground">Mínimo 6 caracteres, con letras y números</p>
                    )}
                  </div>

                  {/* Role + Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">{t.role}</label>
                      <Select {...form.register("role")}>
                        <option value="driver">{t.driverRole}</option>
                        <option value="admin">{t.admin}</option>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">{t.phone}</label>
                      <Input {...form.register("phone")} placeholder="+52 xxx xxx xxxx" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                    <Button type="button" variant="ghost" onClick={closeModal} disabled={isPending}>
                      {t.cancel}
                    </Button>
                    <Button type="submit" isLoading={isPending}>
                      {editingUser ? t.save : t.newDriver}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
