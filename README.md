# 🏦 Banco Académico — Sistema Bancario

Aplicación web para administrar clientes y cuentas bancarias, y realizar depósitos, retiros y transferencias. Proyecto académico full-stack.

> **Guía rápida:** esta documentación está escrita paso a paso. Si es tu primera vez con el proyecto, sigue las secciones en orden.

---

## 📋 Contenido

1. [¿Qué hace el sistema?](#1-qué-hace-el-sistema)
2. [Tecnologías](#2-tecnologías)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Instalación en tu computadora](#4-instalación-en-tu-computadora)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Roles y permisos](#6-roles-y-permisos)
7. [Endpoints de la API](#7-endpoints-de-la-api)
8. [Base de datos](#8-base-de-datos)
9. [Despliegue gratis](#9-despliegue-gratis-aiven--render)
10. [Problemas comunes](#10-problemas-comunes)

---

## 1. ¿Qué hace el sistema?

| Módulo | Descripción |
|---|---|
| **Autenticación** | Inicio de sesión con correo y contraseña (JWT) y registro de nuevos clientes. |
| **Clientes** | Alta, consulta, edición, desactivación y reactivación de clientes. |
| **Cuentas** | Apertura de cuentas por tipo, consulta de saldo y activación/desactivación. |
| **Depósitos** | Suma dinero al saldo de una cuenta activa. |
| **Retiros** | Resta dinero del saldo; no permite retirar más de lo disponible. |
| **Transferencias** | Mueve dinero entre dos cuentas en una sola operación. |
| **Movimientos** | Historial de operaciones por cuenta y reporte resumen. |

Las operaciones de dinero se ejecutan dentro de **transacciones** con bloqueo de fila, para evitar saldos incorrectos si llegan dos operaciones al mismo tiempo.

---

## 2. Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Angular (componentes standalone, formularios reactivos, signals) |
| Backend | Node.js + Express + TypeScript |
| Base de datos | MySQL 8 con procedimientos almacenados |
| Autenticación | JSON Web Tokens (JWT) |
| Gestor de paquetes | pnpm |

---

## 3. Estructura del proyecto

```
Sistema_Financiero/
├── backend/
│   └── src/
│       ├── config/          # Conexión a MySQL (pool)
│       ├── controllers/     # Lógica de cada módulo
│       ├── middlewares/     # Autenticación, roles y manejo de errores
│       ├── routes/          # Rutas de la API
│       ├── utils/           # JWT, ErrorNegocio, asyncHandler
│       ├── app.ts           # Configuración de Express
│       └── server.ts        # Punto de arranque
└── frontend/
    └── src/app/
        ├── core/            # Servicios, guards, interceptor, modelos y config.ts
        ├── features/        # Pantallas: login, registro, clientes, cuentas,
        │                    # operaciones (depósitos/retiros), transferencias
        └── shared/          # Layout con menú lateral y diálogo de confirmación
```

---

## 4. Instalación en tu computadora

### 4.1 Lo que necesitas instalar

- [Node.js](https://nodejs.org) (versión LTS)
- [pnpm](https://pnpm.io): `npm install -g pnpm`
- [MySQL 8](https://dev.mysql.com/downloads/) (o XAMPP)
- Un cliente SQL como DBeaver o MySQL Workbench (opcional pero recomendado)
- Git

### 4.2 Paso a paso

**Paso 1. Clonar el repositorio**
```bash
git clone https://github.com/<tu-usuario>/Sistema_Financiero.git
cd Sistema_Financiero
```

**Paso 2. Crear la base de datos**

1. Crea una base llamada `sistema_bancario`.
2. Ejecuta tu script SQL, que debe incluir las tablas **y** los procedimientos almacenados (ver [sección 8](#8-base-de-datos)).

**Paso 3. Configurar y arrancar el backend**
```bash
cd backend
pnpm install
```
Crea un archivo `.env` en `backend/` con el contenido de la [sección 5](#5-variables-de-entorno) y luego:
```bash
pnpm build
pnpm start
```
Debes ver en la consola:
```
Conexión a MySQL establecida correctamente.
Servidor escuchando en http://localhost:3000
```
Para comprobarlo, abre `http://localhost:3000/` en el navegador: debe responder un mensaje JSON.

**Paso 4. Arrancar el frontend**

En otra terminal:
```bash
cd frontend
pnpm install
pnpm start
```
Abre `http://localhost:4200`.

**Paso 5. Verificar la conexión entre ambos**

En `frontend/src/app/core/config.ts` debe estar:
```ts
export const API_BASE_URL = 'http://localhost:3000';
```

> 💡 Si el login responde "Error interno del servidor", revisa la terminal del backend: ahí aparece el motivo exacto.

---

## 5. Variables de entorno

Crea `backend/.env` (este archivo **no** se sube a GitHub):

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=sistema_bancario

JWT_SECRET=una_clave_larga_y_secreta
JWT_EXPIRES_IN=8h

# Solo en producción (Render)
FRONTEND_URL=https://tu-frontend.onrender.com
```

| Variable | Para qué sirve |
|---|---|
| `PORT` | Puerto del servidor (Render lo asigna solo). |
| `DB_*` | Datos de conexión a MySQL. |
| `JWT_SECRET` | Clave con la que se firman los tokens de sesión. Mantenla privada. |
| `JWT_EXPIRES_IN` | Duración de la sesión. |
| `FRONTEND_URL` | Dominio del frontend permitido por CORS en producción. |
| `DB_CA` | Certificado SSL de la base, solo si tu proveedor lo exige (por ejemplo, Aiven). |

---

## 6. Roles y permisos

| Acción | Administrador | Cajero | Cliente |
|---|:---:|:---:|:---:|
| Iniciar sesión | ✅ | ✅ | ✅ |
| Registrarse (público) | — | — | ✅ |
| Gestionar clientes | ✅ | ✅ | ❌ |
| Abrir cuentas / cambiar estado | ✅ | ✅ | ❌ |
| Ver cuentas | ✅ todas | ✅ todas | Solo las suyas |
| Depósitos y retiros | ✅ | ✅ | ❌ |
| Transferencias | ✅ | ✅ | Solo desde sus cuentas |
| Ver movimientos de una cuenta | ✅ | ✅ | Solo las suyas |
| Listado global y reporte resumen | ✅ | ✅ | ❌ |

El registro público solo puede crear usuarios con rol **cliente**. La seguridad real está en el backend; el frontend solo oculta las pantallas que cada rol no puede usar.

---

## 7. Endpoints de la API

Todas las rutas, excepto `/auth/login` y `/auth/registro`, requieren el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/registro` | Registrar un cliente nuevo |
| POST | `/auth/logout` | Cerrar sesión |
| GET / POST | `/clientes` | Listar / crear clientes |
| GET / PUT / PATCH | `/clientes/:id` | Ver / actualizar un cliente |
| DELETE | `/clientes/:id` | Desactivar un cliente |
| PATCH | `/clientes/:id/reactivar` | Reactivar un cliente |
| GET / POST | `/cuentas` | Listar / abrir cuentas |
| GET | `/cuentas/:id` | Ver una cuenta |
| PUT / PATCH | `/cuentas/:id` | Cambiar estado de una cuenta |
| GET | `/tipos-cuenta` | Catálogo de tipos de cuenta |
| POST | `/depositos` | Registrar un depósito |
| POST | `/retiros` | Registrar un retiro |
| POST | `/transferencias` | Registrar una transferencia |
| GET | `/movimientos` | Listado global de movimientos |
| GET | `/movimientos/reportes/resumen` | Resumen de operaciones |
| GET | `/movimientos/:id_cuenta` | Historial de una cuenta |

**Ejemplo: depósito**
```http
POST /depositos
Content-Type: application/json

{ "id_cuenta": 1, "monto": 250.50 }
```
Respuesta:
```json
{
  "mensaje": "Depósito registrado correctamente.",
  "id_cuenta": 1,
  "monto": 250.5,
  "saldo_actual": 1250.5
}
```

**Reglas de negocio:** el monto debe ser mayor que cero, la cuenta debe estar activa y un retiro o transferencia no puede superar el saldo.

---

## 8. Base de datos

**Tablas** (con mayúscula inicial, tal como las consulta el código):

`Usuario` · `Cliente` · `Cuenta` · `TipoCuenta` · `Movimiento` · `Transferencia`

**Procedimientos almacenados:**

`sp_registrar_deposito` · `sp_registrar_retiro` · `sp_registrar_transferencia` · `sp_consultar_movimientos` · `sp_reporte_resumen_operaciones`

> ⚠️ **Mayúsculas y minúsculas:** MySQL en Windows ignora la diferencia, pero en Linux (Aiven, Render) no. Si exportas tu base desde Windows, las tablas pueden salir en minúscula y el sistema fallará en producción. Renómbralas así:
> ```sql
> RENAME TABLE cliente TO Cliente, cuenta TO Cuenta, movimiento TO Movimiento,
>              tipocuenta TO TipoCuenta, transferencia TO Transferencia, usuario TO Usuario;
> ```

**Exportar tu base incluyendo los procedimientos** (desde DBeaver: *Tools → Dump database*, marcando *Remove DEFINER* y dejando *No routines* desmarcada), o por terminal:
```bash
mysqldump -u root -p --routines --triggers --no-tablespaces sistema_bancario > dump.sql
```

---

## 9. Despliegue gratis (Aiven + Render)

```
Angular (Render Static Site) → Express (Render Web Service) → MySQL (Aiven)
```

### 9.1 Base de datos en Aiven

1. Crea una cuenta en [aiven.io](https://aiven.io) y un servicio **MySQL** con el plan **Free**.
2. El nombre del proyecto no admite espacios (usa guiones: `sistema-bancario`).
3. Espera a que el estado sea **Running** (2 a 5 minutos).
4. Copia Host, Port, User, Password y descarga el certificado `ca.pem`.
5. Conéctate con DBeaver (pestaña **SSL**: activa *Require SSL* y selecciona el `ca.pem`).
6. Importa tu `dump.sql` en la base `defaultdb` (editor SQL → **Alt+X**).
7. Verifica:
   ```sql
   SHOW TABLES;
   SHOW PROCEDURE STATUS WHERE Db = 'defaultdb';
   ```

### 9.2 Backend en Render

1. **New + → Web Service**, conecta el repositorio y la rama.
2. Configura:
   - **Root Directory:** `backend/`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Instance Type:** Free
3. Agrega las variables de entorno: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (= `defaultdb`), `DB_CA`, `JWT_SECRET`, `JWT_EXPIRES_IN` y `FRONTEND_URL`.
4. En los logs debes ver `Conexión a MySQL establecida correctamente`.
5. Copia la URL pública y ábrela en el navegador: debe mostrar el mensaje JSON de la API.

### 9.3 Frontend en Render

1. En `frontend/src/app/core/config.ts` pon la URL del backend, **sin `/` al final**:
   ```ts
   export const API_BASE_URL = 'https://tu-backend.onrender.com';
   ```
2. Haz commit y push.
3. **New + → Static Site**, mismo repositorio:
   - **Root Directory:** `frontend/`
   - **Build Command:** `pnpm install && pnpm build`
   - **Publish Directory:** `dist/frontend/browser`
4. En **Redirects/Rewrites** agrega: Source `/*` → Destination `/index.html` → **Rewrite**.
5. Copia la URL del Static Site y ponla en `FRONTEND_URL` del backend (sin `/` al final).

> ⏱️ En el plan gratis, el backend se duerme tras un rato sin uso y la primera petición puede tardar hasta un minuto.

---

## 10. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Table '...Usuario' doesn't exist` | Tablas en minúscula en un servidor Linux | Renombrarlas con `RENAME TABLE` (sección 8). |
| Error de CORS en la consola del navegador | URL del backend mal escrita, backend dormido o `FRONTEND_URL` incorrecto | Copia la URL desde Render (no la escribas a mano), espera a que despierte y revisa `FRONTEND_URL`. |
| "Not Found" en texto plano al abrir el backend | La URL no corresponde a ningún servicio (por ejemplo, `0` en lugar de `6`) | Haz clic en el enlace *Available at your primary URL* de los logs. |
| `Ruta no encontrada: GET /auth/login` | El login es POST; el navegador hace GET | Es normal, no es un error. |
| "Error interno del servidor" al iniciar sesión | Falta una variable de entorno o falla la base de datos | Revisa los logs del backend y compara con tu `.env` local. |
| Error al importar el dump en Aiven | `DEFINER` en el script o `USE`/`CREATE DATABASE` | Exporta con *Remove DEFINER* y elimina esas líneas. |
| `mysql` no se reconoce como comando | El cliente de MySQL no está en el PATH | Usa DBeaver o ejecuta `mysql.exe` desde su carpeta `bin`. |
| Recargar una pantalla da 404 en el frontend | Falta la regla de rewrite | Agrega `/*` → `/index.html` (Rewrite). |

---

## 🔒 Seguridad

- Nunca subas `.env`, contraseñas ni certificados al repositorio (verifica que `.gitignore` incluya `.env`, `node_modules` y `dist`).
- Usa un `JWT_SECRET` largo y distinto en producción.
- Las contraseñas se guardan cifradas (hash), nunca en texto plano.

## 📄 Licencia y autoría

Proyecto académico desarrollado como parte del curso de Desarrollo de Software en Fundación Kinal.
