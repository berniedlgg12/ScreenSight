# 📺 ScreenSight — DOOH AdOps OS Technical Handbook (v3.0)

**ScreenSight** es un sistema de grado industrial para la gestión, monitoreo y distribución de redes de señalización digital (Digital Out-of-Home). Diseñado para operar sobre flotas masivas de Smart TVs distribuidas geográficamente con control granular por nodo (Store-Level Control).

---

## 🏗️ 1. Arquitectura de Sistemas y Topología de Red

El sistema utiliza una arquitectura de **Sincronización Asincrónica** sobre Firebase, eliminando la necesidad de WebSockets tradicionales mediante el uso de listeners reactivos de baja latencia.

### 🧩 Stack Tecnológico (Core Stack)
- **Frontend Core**: Next.js 15 (App Router) bajo modelo de Server-Side Rendering para Dashboard y Client-Side Rendering para el Player.
- **Data Layer**: Cloud Firestore (NoSQL) con persistencia offline habilitada.
- **Media Engine**: Firebase Storage con CDN global para entrega de video 4K.
- **Telemetry**: API Route especializada para ingestión de latidos (Heartbeats) y cálculo de drift.

---

## 📐 2. Modelo de Datos y Jerarquía Operativa

ScreenSight implementa una jerarquía de herencia de comandos para garantizar la resiliencia operativa.

### 🧬 Estructura de Entidades
1. **Territory (Region)**: Entidad de planificación. Define horarios de operación, zonas horarias y la generación del loop regional (`GeneratedPlaylist`).
2. **Retail Node (Store)**: Punto de control principal. Los comandos emitidos a `stores/{id}.tvCommand` tienen propagación atómica a todos los dispositivos vinculados.
3. **Display (Device)**: El hardware final. Ejecuta un motor de playback persistente que prioriza comandos directos sobre los masivos.

---

## 📡 3. Protocolo de Telemetría (Real-Time Health Check)

La salud de la red se calcula dinámicamente en el cliente (Dashboard) para evitar escrituras costosas en la base de datos, basándose en la frescura de la señal de vida (`lastHeartbeat`).

### ⏱️ Ventanas de Tiempo de Conexión
| Estado | Ventana (T = Ahora - lastHeartbeat) | Lógica de Sistema |
| :--- | :--- | :--- |
| **🟢 ONLINE** | T < 35 segundos | Operación nominal. Pulso de actividad visible en NOC. |
| **🟡 INESTABLE** | 35s <= T < 60 segundos | Alerta preventiva. Indica saturación de ancho de banda o jitter. |
| **⚪ OFFLINE** | T >= 60 segundos | Desconexión confirmada. Se inhabilitan mandos remotos. |

---

## 🎮 4. Centro de Mando de Operaciones (NOC)

El **Mando de Operaciones** implementa un ciclo de vida de comandos con acuse de recibo (ACK) binario. El estado de los controles en el panel se deriva directamente de la telemetría enviada por la TV (`currentPlaybackMode`), no de clics optimistas.

### 🔄 Ciclo de Vida del Comando
1. **Emisión**: El Dashboard inyecta un objeto `tvCommand` con un `commandId` único (UUID/Timestamp).
2. **Propagación**: Firestore distribuye el delta del documento en < 200ms.
3. **Ejecución**: La TV procesa la instrucción basada en su ID para evitar re-ejecuciones en reconexión.
4. **Confirmación (ACK)**: La TV actualiza su documento con `lastCommandStatus: "success"`.

### 🕹️ Comandos Críticos
- **🟢 PLAY**: Re-calcula el offset regional basándose en el `syncStartTime` de la lista de reproducción actual.
- **🟡 PAUSE**: Congela el buffer de renderizado de video de forma local.
- **🔴 SLEEP**: Activa el modo de ahorro de energía mostrando el arte de marca (`standbyImage`).
- **🔄 SYNC**: Realiza un "jump" en el `currentTime` del video para corregir el drift acumulado.
- **⚠️ EMERGENCY**: Interrumpe la capa comercial para mostrar un overlay de alerta global inyectado por el NOC.

---

## 🎞️ 5. Algoritmo de Sincronización (The Sync Engine)

El motor de playback no depende de la descarga del video en tiempo real, sino del **Tiempo Maestro de Época**.

- **Drift Calculation**: El sistema compara el `currentTime` local contra `(Date.now() - syncStartTime) / 1000 % duration`.
- **Auto-Correction**: Si el drift excede los **2.0 segundos**, el player realiza un ajuste de fase silencioso.
- **Persistence**: Ante un reinicio total, la TV identifica su nodo, descarga la receta de la playlist regional y se une al loop en el milisegundo exacto correspondiente a su posición geográfica.

---

## 🛠️ 6. Guía de Inicialización (Bootstrapping)

Para desplegar una nueva flota desde cero:

1. **Infraestructura**: En **Territorios**, ejecute `Initialize AdOps`. Esto crea los clústeres regionales y el Sponsor Maestro para fillers.
2. **Nodos**: Registre la sucursal en **Retail Nodes**. La región se asignará automáticamente mediante el mapeo de estados.
3. **Hardware**: En **Displays**, registre la TV vinculándola a la tienda. Use la URL: `https://dlg.cc/tv?id=DEVICE_ID`.
4. **Media**: Suba los spots en **Media Assets** y vincúlelos a un **Sponsor**.
5. **Campaign**: Cree una **Campaign** definiendo las regiones objetivo.

---
*ScreenSight AdOps OS — Arquitectura de alto rendimiento para señalización digital masiva.*