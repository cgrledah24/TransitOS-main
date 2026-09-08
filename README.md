# Transit Manager

Plataforma web para la gestión operativa de servicios de transporte. Permite
administrar usuarios, conductores y viajes desde un panel centralizado, con
control de acceso por roles, calendario operativo y métricas para supervisar
la actividad del servicio.

## Características principales

- **Autenticación y roles**
  - Inicio de sesión mediante usuario y contraseña.
  - Roles disponibles: `admin` y `driver`.
  - Los administradores gestionan usuarios y todos los viajes.
  - Los conductores consultan únicamente sus viajes asignados.
- **Tablero**
  - Indicadores de viajes y montos.
  - Resumen de actividad por conductor y por mes.
  - Actualización automática de la información cada 60 segundos.
  - Consulta del detalle completo de cada viaje en modo lectura.
  - Avance del estado del viaje desde el detalle.
  - Cancelación de viajes disponible para administradores.
- **Calendario**
  - Visualización mensual de los viajes programados.
  - Acceso rápido a los viajes de una fecha determinada.
- **Gestión de viajes**
  - Creación, edición y eliminación de viajes por parte de administradores.
  - Consulta de origen, destino, conductor, monto, notas, fecha y estado.
  - Filtros por intervalo de fechas y por uno o varios conductores.
  - Los conductores solo pueden actualizar el estado de sus propios viajes.
- **Gestión de usuarios**
  - Alta, edición y eliminación de usuarios por parte de administradores.
  - Asignación del rol de administrador o conductor.
- **Configuración de cuenta**
  - Cambio de contraseña del usuario autenticado.
- **WhatsApp Business**
  - El backend contiene endpoints para configuración, mensajes, contactos y
    webhooks de WhatsApp Business.
  - La sección de WhatsApp permanece oculta en la navegación actual para todos
    los usuarios.

## Estados de los viajes

Los viajes utilizan los siguientes estados:

| Estado | Descripción |
| --- | --- |
| `scheduled` | Viaje programado |
| `in_progress` | Viaje en progreso |
| `completed` | Viaje completado |
| `cancelled` | Viaje cancelado |

El flujo operativo esperado es:

```text
scheduled → in_progress → completed
```

Los administradores pueden cancelar un viaje. Los conductores no pueden
cancelar viajes ni modificar sus datos operativos; únicamente pueden avanzar
el estado de sus propios viajes según las transiciones permitidas.

## Tecnologías utilizadas

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack React Query
- Wouter
- Recharts
- Framer Motion
- Lucide React

### Backend

- Node.js
- Express 5
- TypeScript
- PostgreSQL
- Drizzle ORM
- Zod y Drizzle-Zod
- JWT para sesiones autenticadas
- bcryptjs para almacenamiento seguro de contraseñas

### Herramientas del proyecto

- pnpm Workspaces
- OpenAPI 3.1
- Orval para generar clientes React Query y esquemas
- Replit para desarrollo y despliegue

## Arquitectura del proyecto

```text
.
├── artifacts/
│   ├── api-server/              # API Express
│   │   └── src/
│   │       ├── lib/auth.ts      # Hashing, JWT y autorización
│   │       └── routes/          # Auth, usuarios, viajes y WhatsApp
│   ├── transit-manager/         # Aplicación web React
│   │   └── src/
│   │       ├── components/      # Layout y componentes compartidos
│   │       ├── hooks/           # Autenticación, idioma y utilidades
│   │       └── pages/           # Pantallas de la aplicación
│   └── mockup-sandbox/          # Servidor de previsualización de componentes
├── lib/
│   ├── api-spec/                # Contrato OpenAPI y configuración de Orval
│   ├── api-client-react/        # Cliente React Query generado
│   ├── api-zod/                 # Esquemas Zod generados
│   └── db/                      # Conexión, esquema y utilidades de PostgreSQL
├── scripts/                     # Scripts auxiliares del workspace
├── pnpm-workspace.yaml
└── README.md
```

## Requisitos

- Node.js 24 o compatible con el proyecto.
- pnpm.
- PostgreSQL accesible mediante una cadena de conexión.

Para comprobar las versiones instaladas:

```bash
node --version
pnpm --version
```

## Configuración del entorno

Configura las siguientes variables de entorno antes de iniciar la aplicación:

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión de PostgreSQL |
| `JWT_SECRET` | Sí en producción | Clave utilizada para firmar los tokens de sesión |
| `PORT` | Sí | Puerto del servicio que se va a iniciar |
| `BASE_PATH` | Sí para el frontend | Prefijo de ruta utilizado por Vite y el proxy |

Ejemplo de configuración local:

```bash
export DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/transit_manager"
export JWT_SECRET="genera-una-clave-larga-y-aleatoria"
```

> No guardes valores reales, contraseñas, tokens ni cadenas de conexión en
> GitHub. Utiliza variables de entorno, secretos del entorno de ejecución o el
> administrador de secretos de tu plataforma.

## Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone <URL_DEL_REPOSITORIO>
cd <DIRECTORIO_DEL_PROYECTO>
pnpm install
```

Aplica el esquema de la base de datos:

```bash
pnpm --filter @workspace/db run push
```

El servidor crea un usuario administrador inicial únicamente cuando la tabla
`users` está vacía. Antes de utilizar el sistema en producción, revisa esta
lógica de inicialización, cambia cualquier credencial inicial y configura
`JWT_SECRET` con un valor propio y seguro.

## Desarrollo local

El proyecto está compuesto por un frontend y un servidor API. Inicia cada
servicio en una terminal separada:

### API

```bash
PORT=3001 pnpm --filter @workspace/api-server run dev
```

La API expone sus rutas bajo:

```text
/api
```

### Frontend

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/transit-manager run dev
```

En Replit, los workflows del proyecto proporcionan automáticamente los
puertos, las rutas y la configuración necesaria para ejecutar los servicios.

## Comandos útiles

### Verificación de tipos

```bash
pnpm run typecheck
```

### Verificar un paquete específico

```bash
pnpm --filter @workspace/transit-manager run typecheck
pnpm --filter @workspace/api-server run typecheck
```

### Generar nuevamente el cliente de API

Si modificas `lib/api-spec/openapi.yaml`, regenera los clientes y esquemas:

```bash
pnpm --filter @workspace/api-spec run codegen
```

### Compilar

```bash
pnpm --filter @workspace/transit-manager run build
pnpm --filter @workspace/api-server run build
```

## API

La especificación completa se encuentra en
[`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml).

Todas las rutas protegidas requieren el encabezado:

```http
Authorization: Bearer <token>
```

### Salud y autenticación

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/healthz` | Público | Verifica que la API esté disponible |
| `POST` | `/api/auth/login` | Público | Inicia sesión y devuelve el token |
| `GET` | `/api/auth/me` | Autenticado | Devuelve el usuario actual |

### Usuarios

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/users` | Admin | Lista los usuarios |
| `POST` | `/api/users` | Admin | Crea un usuario |
| `GET` | `/api/users/:id` | Autenticado | Consulta un usuario |
| `PUT` | `/api/users/:id` | Admin | Actualiza un usuario |
| `DELETE` | `/api/users/:id` | Admin | Elimina un usuario |

### Viajes

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/trips` | Autenticado | Lista viajes; el admin ve todos y el conductor los propios |
| `POST` | `/api/trips` | Admin | Crea un viaje |
| `GET` | `/api/trips/:id` | Autenticado | Consulta el detalle de un viaje |
| `PUT` | `/api/trips/:id` | Según rol | Actualiza un viaje o su estado |
| `DELETE` | `/api/trips/:id` | Admin | Elimina un viaje |
| `GET` | `/api/trips/stats` | Autenticado | Devuelve las métricas del tablero |

La lista de viajes acepta los filtros API `year`, `month` y `driverId`. El
tablero refresca sus consultas automáticamente cada 60 segundos.

### WhatsApp Business

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/whatsapp/config` | Admin | Consulta la configuración |
| `PUT` | `/api/whatsapp/config` | Admin | Actualiza la configuración |
| `GET` | `/api/whatsapp/messages` | Autenticado | Lista mensajes |
| `POST` | `/api/whatsapp/messages` | Autenticado | Envía un mensaje |
| `GET` | `/api/whatsapp/contacts` | Autenticado | Lista contactos |
| `GET` | `/api/whatsapp/webhook` | Público | Verifica el webhook |
| `POST` | `/api/whatsapp/webhook` | Público | Recibe eventos del webhook |

## Base de datos

El esquema PostgreSQL está definido con Drizzle ORM:

- `users`: cuentas, roles, perfiles y hashes de contraseña.
- `trips`: fecha, ruta, conductor, monto, notas y estado.
- `whatsapp_config`: configuración de la cuenta de WhatsApp Business.
- `whatsapp_messages`: mensajes entrantes y salientes.

Actualmente los viajes almacenan una **fecha de servicio**, no un campo de hora
independiente. Por ese motivo, los filtros de la interfaz trabajan sobre
fechas y conductores.

## Seguridad

- Nunca publiques credenciales de usuarios o de la base de datos.
- No incluyas archivos `.env` ni valores secretos en commits.
- Define siempre un `JWT_SECRET` único y aleatorio en producción.
- Utiliza HTTPS en cualquier entorno accesible desde Internet.
- Las contraseñas de usuarios se guardan como hashes; no deben desencriptarse ni
  almacenarse en texto plano.
- Revisa y reemplaza cualquier credencial inicial antes de desplegar.
- Concede a la conexión de la aplicación únicamente los permisos de base de
  datos que necesite.

## Despliegue

El proyecto está preparado para ejecutarse como dos servicios:

1. **Transit Manager**: frontend React compilado con Vite.
2. **API Server**: backend Express conectado a PostgreSQL.

Antes de publicar:

1. Configura `DATABASE_URL` en el entorno de producción.
2. Define un `JWT_SECRET` seguro.
3. Aplica el esquema de base de datos.
4. Ejecuta las comprobaciones de tipos y compilación.
5. Verifica `/api/healthz`.
6. Comprueba el inicio de sesión con una cuenta administradora segura.

## Licencia

Este proyecto se distribuye bajo la licencia MIT.