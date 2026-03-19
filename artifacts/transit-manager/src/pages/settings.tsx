import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser } from "@workspace/api-client-react";
import { PageTransition, Card, Button, Input } from "@/components/ui/PremiumComponents";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const updateMutation = useUpdateUser();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema)
  });

  const onSubmit = (data: z.infer<typeof passwordSchema>) => {
    if (!user) return;
    updateMutation.mutate(
      { id: user.id, data: { password: data.password } },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Password updated successfully." });
          reset();
        }
      }
    );
  };

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-3xl">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-display mb-2">Profile Information</h3>
          <p className="text-sm text-muted-foreground mb-6">Your current active profile.</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</label>
              <p className="font-medium mt-1">{user?.fullName}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Username</label>
              <p className="font-medium mt-1">{user?.username}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Role</label>
              <p className="font-medium mt-1 capitalize text-primary">{user?.role}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-display mb-2">Change Password</h3>
          <p className="text-sm text-muted-foreground mb-6">Update your account security.</p>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">New Password</label>
              <Input type="password" {...register("password")} placeholder="••••••••" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm">Confirm Password</label>
              <Input type="password" {...register("confirmPassword")} placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" isLoading={updateMutation.isPending} className="w-full mt-4">
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
