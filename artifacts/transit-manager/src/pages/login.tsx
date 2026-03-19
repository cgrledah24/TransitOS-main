import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button, Card, Input } from "@/components/ui/PremiumComponents";
import { Truck, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { LanguageSelector } from "@/components/layout/LanguageSelector";

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginSchema = z.object({
    username: z.string().min(1, t.passwordRequired),
    password: z.string().min(6, t.passwordMin),
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token);
        toast({ title: t.welcomeBack, description: t.signedInSuccess });
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: t.loginFailed,
          description: err?.message || t.invalidCredentials,
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      <img
        src={`${import.meta.env.BASE_URL}images/login-bg.png`}
        alt="Abstract Tech Background"
        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      {/* Language selector top-right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-4 relative z-10"
      >
        <Card className="p-8 backdrop-blur-2xl bg-card/40 border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/25 mb-4">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">{t.appName}</h1>
            <p className="text-muted-foreground mt-2 text-sm">{t.appSubtitle}</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">{t.username}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                <Input
                  {...form.register("username")}
                  className="pl-12"
                  placeholder={t.usernamePlaceholder}
                />
              </div>
              {form.formState.errors.username && (
                <p className="text-xs text-destructive ml-1">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">{t.password}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                <Input
                  {...form.register("password")}
                  type="password"
                  className="pl-12"
                  placeholder="••••••••"
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive ml-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={loginMutation.isPending}
            >
              {t.signIn}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
