import { useState, useEffect } from "react";
import { useListContacts, useListMessages, useSendMessage, useGetWhatsAppConfig, useUpdateWhatsAppConfig } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { PageTransition, Card, Button, Input, Badge } from "@/components/ui/PremiumComponents";
import { format } from "date-fns";
import { Send, Settings, MessageSquare, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

export default function WhatsApp() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const { toast } = useToast();

  const { data: contacts = [], refetch: refetchContacts } = useListContacts();
  const { data: messages = [], refetch: refetchMessages } = useListMessages(
    { query: { enabled: !!selectedContact, queryKey: ["/api/whatsapp/messages", { contactPhone: selectedContact }] } },
    { request: { params: { contactPhone: selectedContact } } }
  );

  const sendMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        setMessageText("");
        refetchMessages();
        refetchContacts();
      },
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact) return;
    sendMutation.mutate({ data: { to: selectedContact, message: messageText } });
  };

  const { data: config } = useGetWhatsAppConfig();
  const updateConfigMutation = useUpdateWhatsAppConfig({
    mutation: { onSuccess: () => toast({ title: t.configSaved }) },
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (config) {
      reset({
        phoneNumberId: config.phoneNumberId || "",
        accessToken: config.accessToken || "",
        verifyToken: config.verifyToken || "",
        businessAccountId: config.businessAccountId || "",
      });
    }
  }, [config, reset]);

  return (
    <PageTransition className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.whatsappTitle}</h1>
          <p className="text-muted-foreground mt-1">{t.whatsappSubtitle}</p>
        </div>
        <div className="flex bg-card p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "chat" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
          >
            {t.chatTitle}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "settings" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
          >
            {t.configTitle}
          </button>
        </div>
      </div>

      {activeTab === "chat" ? (
        <Card className="flex-1 flex overflow-hidden">
          {/* Contacts */}
          <div className="w-80 border-r border-white/10 bg-white/5 flex flex-col">
            <div className="p-4 border-b border-white/10 font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> {t.contacts}
            </div>
            <div className="flex-1 overflow-y-auto">
              {contacts.map((contact) => (
                <div
                  key={contact.phone}
                  onClick={() => setSelectedContact(contact.phone)}
                  className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/10 transition-colors ${selectedContact === contact.phone ? "bg-primary/10 border-l-4 border-l-primary" : ""}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{contact.name || contact.phone}</span>
                    {contact.unreadCount > 0 && <Badge variant="success">{contact.unreadCount}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                </div>
              ))}
              {contacts.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">{t.noContacts}</div>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col bg-background/50">
            {selectedContact ? (
              <>
                <div className="p-4 border-b border-white/10 bg-white/5 font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  {selectedContact}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-col space-y-4">
                    {messages.map((msg) => {
                      const isOutbound = msg.direction === "outbound";
                      return (
                        <div key={msg.id} className={`flex max-w-[70%] ${isOutbound ? "self-end ml-auto" : "self-start"}`}>
                          <div className={`p-3 rounded-2xl ${isOutbound ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary text-secondary-foreground rounded-tl-sm"}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                            <span className="text-[10px] opacity-70 mt-1 block text-right">
                              {format(new Date(msg.createdAt), "h:mm a")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 bg-white/5">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={t.typeMessage}
                      className="flex-1 bg-background"
                    />
                    <Button type="submit" disabled={!messageText.trim() || sendMutation.isPending}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
                <MessageSquare className="w-12 h-12 opacity-20" />
                {t.selectContact}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="max-w-2xl mx-auto p-8 w-full">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
            <Settings className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-display">Meta API {t.configTitle}</h2>
          </div>
          <form onSubmit={handleSubmit((d) => updateConfigMutation.mutate({ data: d as any }))} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.phoneNumberId}</label>
              <Input {...register("phoneNumberId")} placeholder="e.g. 10123456789" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.businessAccountId}</label>
              <Input {...register("businessAccountId")} placeholder="e.g. 10123456789" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.accessToken}</label>
              <Input type="password" {...register("accessToken")} placeholder="EAAG..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.verifyToken}</label>
              <Input {...register("verifyToken")} placeholder="MySecretToken123" />
            </div>
            <Button type="submit" className="w-full" isLoading={updateConfigMutation.isPending}>
              {t.saveConfig}
            </Button>
          </form>
        </Card>
      )}
    </PageTransition>
  );
}
