# Colibri PWA

Colibri es una aplicacion web tipo PWA para gestionar viajes entre usuarios, conductores y administradores. El proyecto esta dividido en dos partes:

- `Frontend/`: cliente en React + Vite.
- `Backend/`: API en Express + Socket.IO + MongoDB.

Incluye flujo de autenticacion, solicitud de viajes, seguimiento en tiempo real, rutas colectivas, aprobacion de conductores, gestion de tarifas, carga de documentos y correo para verificacion/recuperacion.

## Stack principal

- Frontend: React 18, Vite, Tailwind, Axios, Socket.IO Client
- Backend: Node.js, Express, Mongoose, Socket.IO, Nodemailer, Multer, AWS S3
- Base de datos: MongoDB
- Servicios externos: Google Maps Platform, Gmail SMTP, AWS S3

## Estructura

```text
Colibri-PWA/
|-- Frontend/
|-- Backend/
`-- README.md
```

## Requisitos

- Node.js 18 o superior
- npm
- MongoDB local o Atlas
- Una cuenta/configuracion de Google Maps Platform
- Un bucket de AWS S3
- Una cuenta de correo para SMTP de Gmail

## Instalacion

### 1. Instalar dependencias

```bash
cd Backend
npm install
```

```bash
cd Frontend
npm install
```

### 2. Crear variables de entorno

Crea estos archivos usando las plantillas incluidas:

- `Backend/.env` a partir de `Backend/.env.example`
- `Frontend/.env` a partir de `Frontend/.env.example`

Si quieres separar configuracion por entorno en Vite, tambien puedes usar:

- `Frontend/.env.development`
- `Frontend/.env.production`

## Credenciales y variables necesarias

### Backend

Variables definidas en `Backend/.env.example`

| Variable | Obligatoria | Descripcion |
| --- | --- | --- |
| `PORT` | Si | Puerto del servidor Express. |
| `ENVIRONMENT` | Si | `development` o `production`. |
| `MONGODB_DEV_URL` | Si | Conexion MongoDB para desarrollo. |
| `MONGODB_PROD_URL` | Si | Conexion MongoDB para produccion. |
| `JWT_SECRET` | Si | Secreto para firmar/verificar tokens JWT. |
| `GOOGLE_MAPS_API` | Si | API key de Google Maps usada por el backend para geocoding, distance matrix y autocomplete. |
| `MAIL_USER` | Si | Correo Gmail emisor para verificaciones y recuperacion de password. |
| `MAIL_PASS` | Si | App Password de Gmail, no la contrasena normal. |
| `AWS_REGION` | Si | Region del bucket S3. |
| `AWS_ACCESS_KEY_ID` | Si | Access key de un usuario IAM con permisos sobre S3. |
| `AWS_SECRET_ACCESS_KEY` | Si | Secret key del usuario IAM. |
| `AWS_BUCKET_NAME` | Si | Nombre del bucket donde se suben imagenes y documentos. |
| `SERVER_URL` | Solo produccion | URL publica del backend para el keep-alive de `/reload`. |
| `RELOAD_INTERVAL` | Solo produccion | Intervalo en minutos para el keep-alive. |
| `USD_MXN_RATE` | Recomendable | Tipo de cambio usado por el servicio de moneda. |
| `ADMIN_EMAIL` | Solo si crearas admin por script | Correo del admin inicial. |
| `ADMIN_PASSWORD` | Solo si crearas admin por script | Password del admin inicial. |
| `ADMIN_FIRSTNAME` | Opcional | Nombre del admin inicial. |
| `ADMIN_LASTNAME` | Opcional | Apellido del admin inicial. |

### Frontend

Variables definidas en `Frontend/.env.example`

| Variable | Obligatoria | Descripcion |
| --- | --- | --- |
| `VITE_SERVER_URL` | Si | URL base del backend. Ejemplo: `http://localhost:4000`. |
| `VITE_GOOGLE_MAPS_API_KEY` | Si | API key de Google Maps para cargar el script del mapa en el cliente. |
| `VITE_ENVIRONMENT` | Si | `development` o `production`. |
| `VITE_RIDE_TIMEOUT` | Si | Tiempo en milisegundos para cancelar automaticamente un viaje no confirmado. |

## Credenciales que debes crear

Estas son las credenciales reales que necesitas antes de levantar el proyecto:

1. MongoDB
   Necesitas una URI de conexion para desarrollo y otra para produccion, o la misma si solo usaras un entorno.
2. Google Maps Platform
   Activa al menos Geocoding API, Places API y Distance Matrix API. De aqui salen `GOOGLE_MAPS_API` y `VITE_GOOGLE_MAPS_API_KEY`.
3. Gmail SMTP
   Usa una cuenta Gmail y genera una App Password. Se guarda como `MAIL_PASS`.
4. AWS S3
   Crea un bucket y un usuario IAM con permisos para subir y leer archivos del bucket. De aqui salen `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` y `AWS_BUCKET_NAME`.
5. JWT secret
   Genera una cadena larga y aleatoria para `JWT_SECRET`.
6. Admin inicial
   Si quieres crear el primer administrador por script, define `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

## Ejecucion local

### Backend

```bash
cd Backend
npm run dev
```

Servidor esperado:

- `http://localhost:4000` si dejas `PORT=4000`

### Frontend

```bash
cd Frontend
npm run dev
```

Vite levantara una URL local, normalmente `http://localhost:5173`.

## Script para crear admin inicial

Con las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` definidas en `Backend/.env`, ejecuta:

```bash
cd Backend
node scripts/create-admin.js
```

## Build y despliegue

Frontend:

```bash
cd Frontend
npm run build
```

Backend:

```bash
cd Backend
npm start
```

Importante: el backend intenta servir archivos estaticos desde `Backend/dist`, mientras que Vite por defecto genera el build en `Frontend/dist`. Para despliegue conjunto debes hacer una de estas dos cosas:

1. Copiar el build del frontend a `Backend/dist`.
2. Ajustar `Backend/server.js` para apuntar al directorio real del build del frontend.

## Scripts disponibles

### Frontend

- `npm run dev`: entorno local con Vite
- `npm run build`: build de produccion
- `npm run preview`: vista previa del build
- `npm run lint`: revision de lint

### Backend

- `npm run dev`: backend con nodemon
- `npm start`: backend con node
- `node scripts/create-admin.js`: crea el admin inicial
- `node scripts/sync-rider-vehicles.js`: sincroniza vehiculos de riders

## Notas utiles

- Los archivos `.env` estan ignorados por git; usa los `.env.example` como referencia.
- En produccion, el backend registra logs y ejecuta una llamada periodica a `/reload`.
- El frontend usa Socket.IO para eventos en tiempo real y Google Maps para ubicaciones/rutas.
- El flujo de aprobacion de conductores depende de S3 porque ahi se almacenan documentos e imagenes.
