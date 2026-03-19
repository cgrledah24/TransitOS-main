import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useUpdateUser } from "@workspace/api-client-react";
import { PageTransition, Card, Button, Input } from "@/components/ui/PremiumComponents";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export default function Settings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const updateMutation = useUpdateUser();

  const passwordSchema = z.object({
    password: z.string().min(6, t.passwordMin),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t.passwordMismatch,
    path: ["confirmPassword"],
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (data: z.infer<typeof passwordSchema>) => {
    if (!user) return;
    updateMutation.mutate(
      { id: user.id, data: { password: data.password } },
      {
        onSuccess: () => {
          toast({ title: t.settings, description: t.passwordUpdated });
          reset();
        },
      }
    );
  };

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.settingsTitle}</h1>
        <p className="text-muted-foreground mt-1">{t.settingsSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-display mb-2">{t.profileInfo}</h3>
          <p className="text-sm text-muted-foreground mb-6">{t.profileDesc}</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">{t.fullName}</label>
              <p className="font-medium mt-1">{user?.fullName}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">{t.username}</label>
              <p className="font-medium mt-1">{user?.username}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">{t.role}</label>
              <p className="font-medium mt-1 capitalize text-primary">
                {user?.role === "admin" ? t.admin : t.driverRole}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-display mb-2">{t.changePassword}</h3>
          <p className="text-sm text-muted-foreground mb-6">{t.changePasswordDesc}</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">{t.newPassword}</label>
              <Input type="password" {...register("password")} placeholder="••••••••" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm">{t.confirmPassword}</label>
              <Input type="password" {...register("confirmPassword")} placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" isLoading={updateMutation.isPending} className="w-full mt-4">
              {t.updatePassword}
            </Button>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
