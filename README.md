# 📺 ScreenSight — DOOH AdOps OS Technical Handbook (v4.0)

**ScreenSight** es un sistema de grado industrial para la gestión, monitoreo y distribución de redes de señalización digital (Digital Out-of-Home). Diseñado para operar sobre flotas masivas de Smart TVs distribuidas geográficamente con control granular por nodo (Store-Level Control).

---

## 🏗️ 1. Arquitectura de Sistemas y Capas de Datos

El sistema utiliza una arquitectura de **Sincronización Híbrida** capaz de operar en entornos reales y simulados.

### 🧩 Stack Tecnológico (Core Stack)
- **Frontend Core**: Next.js 15 (App Router) con soporte para Localización Multilingüe.
- **Data Layer**: Cloud Firestore para producción y **Capa de Inteligencia Virtual** para simulaciones de alta escala.
- **Media Engine**: Firebase Storage con CDN global para entrega de video 4K.
- **Telemetry**: Motor de latidos asíncronos con cálculo de drift y desfase de reloj.

---

## 🚀 2. Motor de Simulación Virtual (Zero-Write)

ScreenSight incluye un potente simulador diseñado para presentaciones de alta fidelidad sin coste operativo.

- **Escala Nacional**: Genera instantáneamente **1,800 Nodos de Venta** y **12,450 Pantallas** en memoria.
- **Pulse Engine**: Un motor cíclico refresca los latidos de la flota virtual cada 15 segundos, manteniendo una distribución de salud realista:
  - **🟢 92% ONLINE**: Operación nominal.
  - **🟡 5% INESTABLE**: Simulación de jitter o saturación de red.
  - **🔴 3% OFFLINE**: Desconexión total.
- **Carga Predictiva**: Inyecta datos históricos de 1 año para analíticas de **Proof of Play** y cumplimiento de campañas (Pacing).

---

## 📡 3. Protocolo de Telemetría (Real-Time Health)

La salud de la red se calcula dinámicamente basándose en la frescura de la señal de vida (`lastHeartbeat`).

| Estado | Ventana (T = Ahora - lastHeartbeat) | Lógica de Sistema |
| :--- | :--- | :--- |
| **🟢 ONLINE** | T < 35 segundos | Operación nominal. |
| **🟡 INESTABLE** | 35s <= T < 60 segundos | Alerta preventiva de congestión. |
| **⚪ OFFLINE** | T >= 60 segundos | Desconexión confirmada. |

---

## 📊 4. Inteligencia y Auditoría (Proof of Play)

El sistema implementa un robusto motor de analíticas con capacidades de segmentación granular.

### 🔍 Filtrado Multidimensional
Permite auditar la red por:
- **Territorios (Regiones)**: Análisis geográfico del rendimiento.
- **Retail Nodes (Sucursales)**: Diagnóstico individual por tienda.
- **Advertisers & Campaigns**: Seguimiento de cumplimiento (Pacing) por marca.

### 📄 Reportes PDF Inteligentes
Generación de certificados de emisión que incluyen el **Audit Scope** (filtros aplicados) y métricas verificadas de impresiones y tiempo al aire, listos para auditorías externas.

---

## 🌍 5. Localización y Accesibilidad

ScreenSight es una plataforma global con soporte nativo para los idiomas más hablados:
- **English (US)**
- **Español (ES)**
- **Français (FR)**
- **हिन्दी (Hindi)**
- **中文 (Mandarin)**

La configuración se gestiona en **Settings -> General** y se persiste de forma local para cada operador.

---

## 🎮 6. Centro de Mando de Operaciones (NOC)

El **Mando de Operaciones** implementa un ciclo de vida de comandos con acuse de recibo (ACK).

### 🕹️ Comandos Críticos
- **🟢 PLAY / RESUME**: Activa el loop sincronizado regional.
- **🟡 PAUSE**: Congela el buffer de renderizado localmente.
- **🔴 SLEEP / STANDBY**: Muestra arte de marca y entra en ahorro de energía.
- **⚠️ EMERGENCY**: Overlay de alerta global con mensaje inyectado desde el NOC.
- **🔄 SYNC / RELOAD**: Corrige el drift de tiempo o refresca la aplicación.

---

## 🎞️ 7. Algoritmo de Sincronización (The Sync Engine)

El motor de playback utiliza el **Tiempo Maestro de Época** para garantizar que todas las TVs de una región vean el mismo frame al mismo tiempo.

- **Interleaving**: Combina anuncios de campaña con rellenos de marca (Sponsor Maestro) automáticamente.
- **Auto-Correction**: Si el drift excede los **2.0 segundos**, el player realiza un ajuste de fase silencioso.
- **Persistence**: Ante un reinicio, la TV identifica su nodo, descarga la receta de la playlist regional y se une al loop en el milisegundo exacto.

---
*ScreenSight AdOps OS — Arquitectura de alto rendimiento para señalización digital masiva.*