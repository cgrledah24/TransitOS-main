import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "en" | "es";

const translations = {
  en: {
    appName: "TransitOS",
    appSubtitle: "Sign in to manage your transport operations",

    // Auth
    username: "Username",
    password: "Password",
    signIn: "Sign In",
    signOut: "Sign Out",
    loginFailed: "Login failed",
    invalidCredentials: "Invalid credentials",
    welcomeBack: "Welcome back!",
    signedInSuccess: "Successfully signed in.",
    usernamePlaceholder: "admin",
    passwordRequired: "Username is required",
    passwordMin: "Password must be at least 6 characters",

    // Nav
    dashboard: "Dashboard",
    calendar: "Calendar",
    trips: "Trips",
    drivers: "Users",
    whatsapp: "WhatsApp",
    settings: "Settings",

    // Dashboard
    dashboardSubtitleAdmin: "Operations summary",
    dashboardSubtitleDriver: "My trips",
    tripsThisMonth: "Trips this month",
    myTrips: "My trips",
    revenueThisMonth: "Revenue this month",
    myRevenue: "My revenue",
    completed: "Completed",
    scheduled: "Scheduled",
    inProgress: "In Progress",
    cancelled: "Cancelled",
    tripsByDriver: "Trips by driver",
    monthlyRevenue: "Monthly revenue",
    noData: "No data available",
    upcomingTrips: "Upcoming trips",
    myUpcomingTrips: "My upcoming trips",
    noUpcomingTrips: "No upcoming trips",

    // Calendar
    calendarTitle: "Calendar",
    calendarSubtitle: "Schedule and manage transport trips.",
    addTrip: "Add Trip",
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],

    // Trips
    tripsTitle: "Trips",
    tripsSubtitleAdmin: "All transit records.",
    tripsSubtitleDriver: "Your assigned trips.",
    search: "Search trips…",
    newTrip: "New Trip",
    origin: "Origin",
    destination: "Destination",
    date: "Date",
    driver: "Driver",
    amount: "Amount",
    notes: "Notes",
    status: "Status",
    actions: "Actions",
    noTrips: "No trips found.",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    tripCreated: "Trip created",
    tripUpdated: "Trip updated",
    tripDeleted: "Trip deleted",
    selectDriver: "Select driver",
    selectStatus: "Select status",
    missingFields: "Missing required fields",
    all: "All",
    startTrip: "Start",
    completeTrip: "Complete",
    statusUpdated: "Status updated",
    tripStatusChanged: "Trip status changed successfully",

    // Users
    driversTitle: "Users",
    driversSubtitle: "Manage user accounts.",
    newDriver: "New User",
    fullName: "Full Name",
    phone: "Phone",
    role: "Role",
    admin: "Admin",
    driverRole: "Driver",
    driverCreated: "User created",
    driverUpdated: "User updated",
    driverDeleted: "User deleted",
    noDrivers: "No users found.",
    usernameExists: "Username already exists",

    // WhatsApp
    whatsappTitle: "WhatsApp",
    whatsappSubtitle: "Messages and configuration.",
    contacts: "Contacts",
    chatTitle: "Chat",
    configTitle: "Configuration",
    selectContact: "Select a contact to view messages",
    noContacts: "No contacts yet",
    sendMessage: "Send message",
    typeMessage: "Type a message…",
    send: "Send",
    phoneNumberId: "Phone Number ID",
    accessToken: "Access Token",
    verifyToken: "Verify Token",
    businessAccountId: "Business Account ID",
    saveConfig: "Save Configuration",
    configSaved: "Configuration saved",
    notConfigured: "Not configured",
    configured: "Configured",

    // Settings
    settingsTitle: "Settings",
    settingsSubtitle: "Manage your account preferences.",
    profileInfo: "Profile Information",
    profileDesc: "Your current active profile.",
    changePassword: "Change Password",
    changePasswordDesc: "Update your account security.",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    updatePassword: "Update Password",
    passwordUpdated: "Password updated successfully.",
    passwordMismatch: "Passwords do not match",

    // Language
    language: "Language",
    english: "English",
    spanish: "Spanish",
  },

  es: {
    appName: "TransitOS",
    appSubtitle: "Inicia sesión para gestionar tus operaciones de transporte",

    // Auth
    username: "Usuario",
    password: "Contraseña",
    signIn: "Iniciar Sesión",
    signOut: "Cerrar Sesión",
    loginFailed: "Error de inicio de sesión",
    invalidCredentials: "Credenciales inválidas",
    welcomeBack: "¡Bienvenido de vuelta!",
    signedInSuccess: "Sesión iniciada correctamente.",
    usernamePlaceholder: "admin",
    passwordRequired: "El usuario es obligatorio",
    passwordMin: "La contraseña debe tener al menos 6 caracteres",

    // Nav
    dashboard: "Tablero",
    calendar: "Calendario",
    trips: "Viajes",
    drivers: "Usuarios",
    whatsapp: "WhatsApp",
    settings: "Configuración",

    // Dashboard
    dashboardSubtitleAdmin: "Resumen de operaciones",
    dashboardSubtitleDriver: "Mis viajes",
    tripsThisMonth: "Viajes este mes",
    myTrips: "Mis viajes",
    revenueThisMonth: "Ingresos este mes",
    myRevenue: "Mis ingresos",
    completed: "Completado",
    scheduled: "Programado",
    inProgress: "En curso",
    cancelled: "Cancelado",
    tripsByDriver: "Viajes por transportista",
    monthlyRevenue: "Ingresos mensuales",
    noData: "No hay datos disponibles",
    upcomingTrips: "Próximos viajes",
    myUpcomingTrips: "Mis próximos viajes",
    noUpcomingTrips: "No hay viajes próximos",

    // Calendar
    calendarTitle: "Calendario",
    calendarSubtitle: "Programa y gestiona los viajes de transporte.",
    addTrip: "Agregar Viaje",
    weekDays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],

    // Trips
    tripsTitle: "Viajes",
    tripsSubtitleAdmin: "Todos los registros de tránsito.",
    tripsSubtitleDriver: "Tus viajes asignados.",
    search: "Buscar viajes…",
    newTrip: "Nuevo Viaje",
    origin: "Origen",
    destination: "Destino",
    date: "Fecha",
    driver: "Transportista",
    amount: "Monto",
    notes: "Notas",
    status: "Estado",
    actions: "Acciones",
    noTrips: "No se encontraron viajes.",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    tripCreated: "Viaje creado",
    tripUpdated: "Viaje actualizado",
    tripDeleted: "Viaje eliminado",
    selectDriver: "Seleccionar transportista",
    selectStatus: "Seleccionar estado",
    missingFields: "Faltan campos obligatorios",
    all: "Todos",
    startTrip: "Iniciar",
    completeTrip: "Completar",
    statusUpdated: "Estado actualizado",
    tripStatusChanged: "El estado del viaje fue actualizado correctamente",

    // Users
    driversTitle: "Usuarios",
    driversSubtitle: "Gestionar cuentas de usuario.",
    newDriver: "Nuevo Usuario",
    fullName: "Nombre Completo",
    phone: "Teléfono",
    role: "Rol",
    admin: "Administrador",
    driverRole: "Transportista",
    driverCreated: "Usuario creado",
    driverUpdated: "Usuario actualizado",
    driverDeleted: "Usuario eliminado",
    noDrivers: "No se encontraron usuarios.",
    usernameExists: "El nombre de usuario ya existe",

    // WhatsApp
    whatsappTitle: "WhatsApp",
    whatsappSubtitle: "Mensajes y configuración.",
    contacts: "Contactos",
    chatTitle: "Chat",
    configTitle: "Configuración",
    selectContact: "Selecciona un contacto para ver los mensajes",
    noContacts: "Aún no hay contactos",
    sendMessage: "Enviar mensaje",
    typeMessage: "Escribe un mensaje…",
    send: "Enviar",
    phoneNumberId: "ID de Número de Teléfono",
    accessToken: "Token de Acceso",
    verifyToken: "Token de Verificación",
    businessAccountId: "ID de Cuenta Business",
    saveConfig: "Guardar Configuración",
    configSaved: "Configuración guardada",
    notConfigured: "Sin configurar",
    configured: "Configurado",

    // Settings
    settingsTitle: "Configuración",
    settingsSubtitle: "Gestiona las preferencias de tu cuenta.",
    profileInfo: "Información de Perfil",
    profileDesc: "Tu perfil activo actual.",
    changePassword: "Cambiar Contraseña",
    changePasswordDesc: "Actualiza la seguridad de tu cuenta.",
    newPassword: "Nueva Contraseña",
    confirmPassword: "Confirmar Contraseña",
    updatePassword: "Actualizar Contraseña",
    passwordUpdated: "Contraseña actualizada correctamente.",
    passwordMismatch: "Las contraseñas no coinciden",

    // Language
    language: "Idioma",
    english: "Inglés",
    spanish: "Español",
  },
} as const;

type Translations = typeof translations.en;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const stored = (localStorage.getItem("transit_lang") as Lang) || "es";
  const [lang, setLangState] = useState<Lang>(stored);

  const setLang = (l: Lang) => {
    localStorage.setItem("transit_lang", l);
    setLangState(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
