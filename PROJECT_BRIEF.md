# PROJECT BRIEF — uide-distributivo-app
> Versión: 2.0 — Reestructurada según directrices de tutora Lorena Conde (jun 2026)
> Autor: Danny Francisco Jaramillo Guachón · dajaramillogu@uide.edu.ec · ORCID: 0009-0007-2370-1597
> Universidad Internacional del Ecuador (UIDE), Campus Loja
> Carrera: Ingeniería en Tecnologías de la Información (9no ciclo)
> Metodología: SCRUM adaptado · IEEE 830 · Marco normativo: LOES, CES 2021

---

## 1. PROBLEMA Y SOLUCIÓN

### Problema
La Dirección de Carrera de UIDE Campus Loja gestiona dos procesos críticos de forma **manual**:

1. **Distributivo de horas** — se elabora en Excel/papel. Errores frecuentes de suma obligan a devoluciones. El director asigna horas por categoría a cada docente; el docente las distribuye en su horario semanal manualmente.

2. **Seguimiento de actividades** — las tareas se asignan por correo electrónico. Los directores llevan control en cuadernos y hojas físicas con colores (rojo = urgente). Se pierden, sin trazabilidad.

### Solución
Aplicación web serverless con IA que:
- Automatiza el cálculo y validación del distributivo académico
- Digitaliza la asignación y seguimiento de actividades con prioridades
- Genera reportes de cumplimiento por período

### Enfoque del documento de tesis
**Tecnológico** — arquitectura serverless, NLP en español, automatización de procesos institucionales.
No incluye marco educativo ni pedagógico (instrucción explícita de la tutora).

---

## 2. STACK TECNOLÓGICO

| Capa | Tecnología |
|---|---|
| Frontend | React (Vite) |
| Backend | Firebase Cloud Functions (serverless, Python) |
| Base de datos | Firestore |
| Autenticación | Firebase Auth + Microsoft Azure AD + OAuth 2.0 |
| NLP / IA | BETO (`dccuchile/bert-base-spanish-wwm-cased`) — clasificación de actividades en español |
| Reportes | jsPDF / pdfmake + SheetJS |
| Calendario (fase futura) | Microsoft Graph API — pendiente credenciales institucionales |
| Directorio (fase futura) | LDAP institucional UIDE — pendiente credenciales |

> **BLOQUEO ACTUAL:** Credenciales de API institucional (correo, LDAP) pendientes del Dpto. TI de UIDE.
> Lorena entregará accesos **solo al ver MVP funcional**. No bloquean el desarrollo del MVP.

---

## 3. ROLES DEL SISTEMA

| Nivel | Rol | Actor | Alcance |
|---|---|---|---|
| 1 | `admin` | Pablo Ruiz Aguirre (Pro-Rector) · paruizag@uide.edu.ec | Global: todas las carreras, configuración |
| 2 | `director` | Lorena Conde Zhingre · locondezh@uide.edu.ec | Su carrera: distributivos, actividades, reportes |
| 3 | `coordinador` | Darío Valarezo León · davalarezole@uide.edu.ec | Su carrera: lectura y apoyo al director |
| 4 | `docente` | Milton Palacios (TC) · Yeferson Torres (MT) | Sus propios datos únicamente |

**Nota:** Un usuario puede tener múltiples roles simultáneos (`roles: ["director", "coordinador"]`).
**Tipos de contrato:** `tiempo_completo` (40h) · `medio_tiempo` (20h) · `tiempo_parcial` (según contrato) · `honorario`

---

## 4. MÓDULO 1 — DISTRIBUTIVO DE HORAS (PRIORIDAD MVP)

### 4.1 Flujo
1. Director ingresa los **datos base** de cada docente
2. Sistema **calcula automáticamente** horas por categoría (reglas §4.3)
3. Docente **distribuye** esas horas en días/franjas horarias de su semana
4. Sistema **valida** que la suma total sea exactamente 40h (TC) / 20h (MT) antes de guardar
5. Director **aprueba** el distributivo → docente **confirma** (validación cruzada RN-019)

### 4.2 Datos base que ingresa el director por docente
```
- Horas de clase asignadas (18–22 h/semana para TC)
- Número de materias que imparte
- Número de paralelos asignados
- Cargo directivo si aplica (para reducciones automáticas)
- Número de proyectos de titulación (como director / como tribunal)
- Número de estudiantes en Prácticas Comunitarias (PC)
- Número de estudiantes en Prácticas Pre Profesionales (PPP)
- Número de graduados bajo seguimiento
- Si es coordinador de investigación (sí/no)
- Si es coordinador de PC (sí/no)
- Si es coordinador de PPP (sí/no)
```

### 4.3 Reglas de negocio — cálculo automático (Reglamento CES 2021)

#### Bloque Docencia
```
horas_clase         → ingresado por director (18–22 h para TC)
preparacion_clases  = horas_clase × 0.60   [AUTOMÁTICO]

tutorias:
  1–2 materias → 1 h/semana
  3–4 materias → 2 h/semana
  5–6 materias → 3 h/semana
```

#### Bloque Investigación
```
reduccion_coord_investigacion  → hasta 6 h (coordinadores de facultad/sede, DGI)
gestion_investigacion          → horas por: revista institucional, CEDIA, comités de bioética
actividades_investigacion      → artículos, proyectos activos (máx 16 h/semana TC)
```

#### Bloque Vinculación
```
reduccion_coordinador_PC   = 3 h fijas (si es coord. de PC)
reduccion_coordinador_PPP  = 3 h fijas (si es coord. de PPP)
horas_seguimiento_graduados = ENTERO(nro_graduados / 80)
horas_PC_docente            = ENTERO(estudiantes_PC / 10)
horas_PPP_docente           = ENTERO(estudiantes_PPP / 15)
```

#### Titulación → Gestión Académica (subcategoría 4.9)
```
La titulación (dirección de trabajos, tribunales, lectores, grados, examen
complexivo) NO es un bloque propio: corresponde a GESTIÓN ACADÉMICA,
subcategoría 4.9 (Tutores, Lectores y Grados). Se registra manualmente en ese
bloque.
```

#### Reducciones por cargo directivo (Gestión Académica)
```
Se aplican automáticamente según campo cargo_directivo del docente en Firestore.
Afectan las horas de docencia de docentes TC con cargos directivos.
Máximo 12 h/semana de Gestión Académica (TC).
```

#### Validación de cierre
```javascript
// src/utils/calculos.js — 4 categorías oficiales.
// docencia incluye 1.1 asignatura + 1.2 tutorías + 1.3 otras;
// gestion incluye titulación (subcat. 4.9).
total = docencia + investigacion + vinculacion + gestion - reducciones_cargo

// TC: total debe ser exactamente 40h (tolerancia 0.01h)
// MT: total debe ser exactamente 20h
// TP: total según contrato individual
// Si diferencia > 0.01h → bloquear guardado y mostrar error con diferencia exacta
```

### 4.4 Restricciones de distribución horaria
- Franja 13:00–14:00 bloqueada (almuerzo) en todos los días
- Tutorías NO deben concentrarse en un solo día (configurable por director)
- Dos actividades del mismo docente no pueden solaparse en la misma franja (RN-024)
- El docente elige libremente cuándo cumple sus horas dentro de los lineamientos del director

### 4.5 Validación cruzada (RN-019)
El distributivo alcanza estado `aprobado` SOLO cuando:
1. Director lo aprueba
2. Docente lo confirma de forma independiente
Si cualquiera observa → vuelve a `en_revision`

---

## 5. MÓDULO 2 — GESTIÓN Y SEGUIMIENTO DE ACTIVIDADES

### 5.1 Flujo
1. Director crea actividad → asigna a docente(s) → categoría + prioridad + fechas
2. Docente recibe notificación in-app → trabaja → sube evidencia → marca completada
3. Director ve en tiempo real estado de todas sus actividades asignadas

### 5.2 Categorías de actividades
```
Cuatro categorías oficiales (Excel UIDE). Las antiguas "Tutoría", "Titulación"
y "Seguimiento a graduados" son subcategorías, no categorías:
- DOCENCIA                      (incluye tutorías → subcategoría 1.2)
- INVESTIGACIÓN
- VINCULACIÓN CON LA SOCIEDAD   (incluye seguimiento a graduados → subcat. 3.3)
- GESTIÓN ACADÉMICA            (incluye tutores, lectores y grados / titulación → subcat. 4.9)
```

### 5.3 Estados y prioridades
```
URGENTE     → rojo, primero en lista, alerta activa
NORMAL      → amarillo
PENDIENTE   → sin urgencia inmediata
COMPLETADA  → verde, archivada con evidencia adjunta
VENCIDA     → rojo oscuro, requiere observación del director
```

### 5.4 Reglas de negocio
- Actividad de categoría X asignada a docente sin horas de esa categoría en su distributivo → **alerta antes de confirmar**
- Director puede ampliar plazo con campo de **observación/justificación obligatorio**
- Observaciones quedan en historial de la actividad (trazabilidad)
- Director ve panel consolidado: docente → actividades → estado → prioridad
- Filtros: por categoría, docente, estado, fecha

### 5.5 Vista del docente
- Lista personal ordenada por prioridad y fecha límite
- Adjuntar evidencia (archivo o URL)
- Marcar como completada

---

## 6. MÓDULO 3 — REPORTES

- Reporte semestral automático: actividades completadas vs. asignadas por categoría y docente
- PDF institucional con encabezado UIDE, tabla CES, firmas de validación cruzada, código verificación CACES
- Previsualización editable obligatoria antes de descargar (RN-025)
- Exportación Excel disponible
- Historial navegable de últimos 5 períodos (solo lectura)
- Datos para decisiones institucionales: contratación, redistribución de carga

---

## 7. NLP / IA — BETO

**Tarea:** Clasificar automáticamente el texto libre de una actividad en las categorías del distributivo.

**Modelo:** `dccuchile/bert-base-spanish-wwm-cased` (BETO) — BERT preentrenado en español.
Justificación: open-source, sin costo de API, ejecutable en Cloud Function Python, F1 ≥ 0.80 documentado en clasificación de texto en español.

**Pipeline:**
```python
# functions/clasificar_actividad.py
def clasificar_actividad(texto):
    texto_limpio = preprocesar(texto)           # minúsculas, stopwords, normalización
    tokens = tokenizer.encode(texto_limpio, max_length=128, truncation=True)
    logits = modelo_beto(tokens)
    probabilidades = softmax(logits)
    return {
        "categoria": CATEGORIAS[argmax(probabilidades)],
        "confianza": float(max(probabilidades)),
        "estado": "provisional"                 # requiere confirmación del director
    }
# Categorías (4 oficiales): docencia | investigacion | vinculacion | gestion
```

**Flujo de uso:**
1. Director escribe nombre/descripción de actividad en texto libre
2. BETO sugiere la categoría más probable (con % de confianza)
3. Director confirma o corrige manualmente
4. Clasificación confirmada queda en historial

**Métricas mínimas:** Precision ≥ 80% · Recall ≥ 80% · F1-score ≥ 80% por categoría

**Estado:** Pipeline heurístico implementado. Fine-tuning pendiente de dataset real.

---

## 8. MÓDULOS QUE SE ELIMINAN (por instrucción de tutora Lorena)

```
❌ MOD-03 — Sincronización Outlook / etiquetas DIST/*
   Razón: "El distributivo ya cumple la función del calendario"
   Lorena fue explícita: el calendario queda fuera del MVP
   Archivos a eliminar:
     src/modules/calendario/ (completo)
     src/services/calendarioService.js
     src/services/outlookLabelsService.js
     src/hooks/useCalendario.js
     functions/sync_outlook.py
   Colecciones Firestore a NO crear: /eventos_calendario

❌ RF-043 — Matriz de Productividad como paso previo al distributivo
   Razón: "No me centraría en la matriz de productividad"
   El distributivo se genera directamente con los datos base del director
   Colecciones a NO crear: /matriz_productividad
   Eliminar: cualquier bloqueo de "distributivo requiere matriz aprobada"

❌ RF-041 — 2 semanas de anticipación para actividades imprevistas
   Razón: No fue mencionado por Lorena. Scope creep interno.
   Eliminar: campo tareas_todo.imprevista y validación de anticipación

❌ RF-042 — Docentes compartidos entre carreras
   Razón: No fue mencionado por Lorena. Fuera de alcance MVP.
   Eliminar: lógica de suma de horas cross-carrera

❌ RF-038 (WhatsApp/Twilio) y RF-044 (oficios formales)
   Razón: Lorena describió notificaciones in-app simples, no canales externos
   Eliminar: functions/whatsapp_notif.py · campo telefono_whatsapp en /usuarios
   Colecciones a NO crear: /oficios
   Conservar: notificaciones in-app (FCM) simples

❌ MOD-09 — Kanban personal del docente (Mis Actividades)
   Razón: Lo que Lorena pidió es gestión de actividades ASIGNADAS POR EL DIRECTOR,
   no un tablero personal de tareas propias del docente. Son conceptos distintos.
   Eliminar:
     src/modules/misactividades/ (completo)
     src/services/misActividadesService.js
     Colección /tareas_todo

❌ MOD-10 — Planet (resumen visual)
   Razón: Componente de apoyo al Kanban eliminado. El dashboard ya cubre esta función.
   Eliminar: src/modules/planet/ (completo)

❌ /planes_mejora y /roles_definicion (colecciones)
   Razón: Complejidad no pedida por Lorena. Fuera de alcance MVP.
```

---

## 9. LO QUE SE CONSERVA SIN CAMBIOS

```
✅ MOD-01 — Autenticación (Firebase Auth + Azure AD + OAuth 2.0 + RoleGuard)
✅ MOD-02 — Distributivo académico (CRUD + cálculo automático + validación 40h)
✅ MOD-04 — Clasificación IA con BETO (Cloud Function Python)
✅ MOD-05 — Dashboard (cumplimiento en tiempo real, alertas, onSnapshot)
✅ MOD-06 — Reportes PDF/Excel institucionales con previsualización
✅ MOD-07 — Notificaciones in-app (FCM, simplificadas)
✅ MOD-08 — Administración (usuarios, períodos, auditoría, configuración)
✅ Todas las fórmulas de cálculo (§4.3) — intactas
✅ Estructura de roles 4 niveles + tipos de contrato
✅ Validación cruzada director-docente (RN-019)
✅ Vista gráfica semanal del distributivo (CalendarioDistributivo.jsx)
✅ Historial de períodos (últimos 5, solo lectura)
✅ Modales Liquid Glass para formularios
✅ Períodos académicos independientes (RN-020 a RN-022)
✅ Firestore rules con mismaCarrera() y control por carrera_id
✅ Colecciones: /usuarios /docentes /periodos_academicos /distributivos
              /actividades /clasificaciones_ia /notificaciones
              /reportes /auditoria /configuracion /carreras
✅ Seed: 7 carreras + 5 usuarios Ingeniería en Sistemas
✅ Reglas de Firestore v1.4 con modelo multi-rol roles[]
```

---

## 10. MÓDULO DE ACTIVIDADES — VERSIÓN CORRECTA (según Lorena)

Este módulo reemplaza conceptualmente al antiguo MOD-09 Kanban.
**No es un tablero personal — es gestión de tareas asignadas por el director.**

### Colección /actividades (ya existente, ajustar campos)
```javascript
{
  id:               "act_abc123",
  titulo:           "Elaborar informe de vinculación Q2",
  descripcion:      "Texto libre del director",
  categoria_ces:    "vinculacion",         // clasificada por BETO o director
  asignada_por_uid: "uid_locondezh",       // director que asigna
  asignada_a_uid:   "uid_mipalaciosmo",    // docente destinatario
  carrera_id:       "sistemas-informacion",
  periodo_id:       "2026-A",
  prioridad:        "urgente",             // urgente | normal | pendiente
  estado:           "en_progreso",         // pendiente | en_progreso | completada | vencida
  fecha_inicio:     Timestamp,
  fecha_limite:     Timestamp,
  fecha_completada: Timestamp | null,
  evidencia_url:    "https://..." | null,
  observacion:      "Texto de ampliación de plazo" | null,
  creada_en:        Timestamp,
}
```

---

## 11. ESTRUCTURA DE CARPETAS — LIMPIA (POST-REESTRUCTURACIÓN)

```
uide-distributivo-app/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── icons.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── AlertBanner.jsx
│   │   ├── Modal.jsx
│   │   └── NotificationBell.jsx
│   ├── modules/
│   │   ├── auth/              ✅ CONSERVAR completo
│   │   ├── dashboard/         ✅ CONSERVAR completo
│   │   ├── distributivo/      ✅ CONSERVAR completo
│   │   ├── actividades/       🔄 ADAPTAR (era gestión de actividades asignadas)
│   │   ├── ia/                ✅ CONSERVAR completo
│   │   ├── reportes/          ✅ CONSERVAR completo
│   │   ├── notificaciones/    ✅ CONSERVAR (simplificado, sin WhatsApp)
│   │   ├── admin/             ✅ CONSERVAR completo
│   │   ├── ayuda/             ✅ CONSERVAR (RF-039)
│   │   ├── perfil/            ✅ CONSERVAR
│   │   ├── calendario/        ❌ ELIMINAR completo
│   │   ├── misactividades/    ❌ ELIMINAR completo
│   │   └── planet/            ❌ ELIMINAR completo
│   ├── services/
│   │   ├── firebase.js        ✅
│   │   ├── authService.js     ✅
│   │   ├── distributivoService.js ✅
│   │   ├── actividadesService.js  ✅
│   │   ├── iaService.js       ✅
│   │   ├── reportesService.js ✅
│   │   ├── notificacionesService.js ✅ (sin Twilio)
│   │   ├── periodoService.js  ✅
│   │   ├── horarioService.js  ✅
│   │   ├── misActividadesService.js ❌ ELIMINAR
│   │   ├── calendarioService.js     ❌ ELIMINAR
│   │   └── outlookLabelsService.js  ❌ ELIMINAR
│   ├── hooks/
│   │   ├── useDistributivo.js ✅
│   │   ├── useNotificaciones.js ✅
│   │   ├── useReportes.js     ✅
│   │   └── useCalendario.js   ❌ ELIMINAR
│   ├── context/               ✅ CONSERVAR
│   ├── router/                ✅ CONSERVAR
│   └── utils/
│       └── calculos.js        ✅ CONSERVAR — fórmulas CES intactas
├── functions/                 ✅ CONSERVAR
│   ├── clasificar_actividad.py ✅
│   ├── notificaciones.py      ✅ (FCM simple, sin Twilio)
│   ├── main.py                ✅
│   └── sync_outlook.py        ❌ ELIMINAR
└── PROJECT_BRIEF.md           ← este archivo
```

---

## 12. ESTADO DEL PROYECTO — SPRINTS

| Ítem | Estado |
|---|---|
| Sprint 0 — Setup + seed datos | ✅ Completado |
| Sprint 1 — Distributivo CRUD + cálculo | ✅ Completado |
| Sprint 2 — Outlook sync | ❌ ELIMINADO del alcance |
| Sprint 3 — BETO pipeline | 🔄 En curso |
| Sprint 4 — Dashboard tiempo real | 🔄 En curso |
| Sprint 5 — Reportes PDF | ✅ Completado |
| Sprint 6 — Integración final + reestructuración | 🔴 PRIORIDAD ACTUAL |
| MVP mostrable para Lorena | 🔴 PRIORIDAD INMEDIATA |

---

## 13. ESTRUCTURA DEL DOCUMENTO DE TESIS (Springer LNCS)

```
1. Introducción
   → Contexto: procesos manuales en UIDE Campus Loja
   → Problema concreto: distributivo en Excel, actividades por correo
   → Solución propuesta: app serverless + IA
   → Sin citas excesivas, sin lenguaje inflado (instrucción Lorena)

2. Estado del arte
   → Comparación con investigaciones similares (otros sistemas de gestión académica)
   → No mezclar con marco teórico

3. Marco teórico
   → NLP y BETO (especificar modelo, justificar elección)
   → Arquitectura serverless (Firebase)
   → React.js / Firestore
   → Scrum adaptado
   → SIN contenido educativo ni pedagógico (instrucción Lorena)

4. Metodología
   → Fases del proyecto (sprints van AQUÍ, no en marco teórico)
   → IEEE 830
   → Cualitativo-descriptivo

5. Resultados
   → Descripción del sistema construido
   → Métricas: F1-score BETO, SUS ≥ 70, 0 errores de cálculo

6. Conclusiones
```

### Observaciones pendientes de Lorena
- [ ] Especificar BETO vs RoBERTa-es con justificación explícita
- [ ] Separar estado del arte del marco teórico (estaban mezclados)
- [ ] Mover fases del método al capítulo de metodología
- [ ] Reescribir introducción: historia directa del problema
- [ ] **No habrá acceso a APIs institucionales hasta ver MVP funcional**

---

## 14. INSTRUCCIONES PARA CLAUDE CODE CLI

```
REGLAS DE ORO:
1. No modificar funcionalidad existente que ya funcione
2. Ejecutar de forma autónoma sin pausas de confirmación intermedias
3. Leer RESTRUCTURE.md para saber qué eliminar antes de tocar cualquier archivo
4. Las fórmulas de cálculo en src/utils/calculos.js son INTOCABLES
5. Ante duda sobre si algo entra en el alcance → consultar sección 8 de este archivo
6. Prioridad actual: MVP funcional con módulos 1, 2 y 3 operativos

STACK: React + Firebase (Firestore + Cloud Functions Python)
MODELO IA: BETO dccuchile/bert-base-spanish-wwm-cased
SEED USERS: 5 usuarios en sistemas-informacion (ver sección 3)
```

---

## 15. VISTA DEL DOCENTE — ACTIVIDADES (especificación completa)

### 15.1 Concepto
El docente NO crea actividades. Solo recibe las que el director le asigna.
Su vista tiene dos partes: **lista de actividades** + **indicadores de progreso por categoría CES**.

### 15.2 Layout de la vista (MisActividadesPage.jsx — renombrar concepto)

```
┌─────────────────────────────────────────────────────────┐
│  MIS ACTIVIDADES — Período Mayo–Agosto 2026             │
│                                                         │
│  [Filtro: Todas | Pendiente | En progreso | Completada  │
│           Vencida]                    [Solo período activo] │
├─────────────────────────────────────────────────────────┤
│  PROGRESO POR CATEGORÍA                                 │
│                                                         │
│  Docencia      [████████░░] 4/5  80%                   │
│  Investigación [██░░░░░░░░] 1/4  25%                   │
│  Vinculación   [██████████] 3/3  100%                  │
│  Gestión Acad. [████░░░░░░] 2/4  50%                   │
├─────────────────────────────────────────────────────────┤
│  LISTA DE ACTIVIDADES                                   │
│                                                         │
│  🔴 URGENTE  · Investigación                           │
│  Elaborar artículo Q2                                   │
│  Asignada por: Lorena Conde · Vence: 20 jun 2026       │
│  [En progreso ▼]  [Subir evidencia]                    │
│                                                         │
│  🟡 NORMAL   · Vinculación                             │
│  Informe prácticas comunitarias                         │
│  Asignada por: Lorena Conde · Vence: 30 jun 2026       │
│  [Pendiente ▼]  [Subir evidencia]                      │
│                                                         │
│  ✅ COMPLETADA · Docencia                              │
│  Subir notas parciales                                  │
│  Completada: 10 jun 2026 · Evidencia adjunta ✓         │
└─────────────────────────────────────────────────────────┘
```

### 15.3 Indicadores de progreso por categoría CES
- Una barra por cada categoría que el docente tenga en su distributivo
- Muestra: completadas / total asignadas en esa categoría + porcentaje
- Solo categorías con al menos 1 actividad asignada
- Se actualiza en tiempo real con Firestore `onSnapshot`
- **NO usa fetch adicional** — mismo estado React que la lista

### 15.4 Lista de actividades

**Ordenamiento por defecto:**
```
1. Vencidas (rojo oscuro) — primero siempre
2. Urgentes (rojo) — por fecha límite ascendente
3. Normales (amarillo) — por fecha límite ascendente
4. Pendientes (sin color)
5. Completadas — al final, colapsadas por defecto
```

**Filtros disponibles (botones de toggle):**
```
Todas | Pendiente | En progreso | Completada | Vencida
```
Solo del período activo — no hay acceso a períodos anteriores desde esta vista.

**Por cada actividad el docente ve:**
```
- Prioridad (color)
- Categoría CES
- Título y descripción
- Asignada por (nombre del director)
- Fecha límite
- Estado actual (dropdown para cambiar: pendiente → en progreso → completada)
- Botón subir evidencia (archivo o URL)
- Observación del director si existe (ampliación de plazo, etc.)
```

**Cambio de estado por el docente:**
```
pendiente → en_progreso → completada
              ↑ solo el docente puede mover hacia adelante
              El director puede marcar como "vencida" si supera la fecha límite
```

### 15.5 Flujo de evidencia
1. Docente hace clic en "Subir evidencia"
2. Modal con dos opciones: subir archivo (Firebase Storage) o pegar URL
3. Al guardar → `evidencia_url` se actualiza en Firestore
4. Estado cambia automáticamente a `completada` si el docente confirma
5. Director ve la evidencia desde su panel consolidado

### 15.6 Notificaciones al docente

**Cuándo se notifica:**
```
- Nueva actividad asignada por el director
- Actividad próxima a vencer (48h antes)
- Director amplió plazo de una actividad (con observación)
- Director marcó una actividad como vencida
```

**Canales:**
```
1. In-app: campana NotificationBell.jsx → badge con contador → bandeja /notificaciones
2. Correo Outlook: Cloud Function Python usa Microsoft Graph API Mail.Send
   → correo al @uide.edu.ec del docente
   → NO requiere sync de calendario, solo permiso Mail.Send en Azure AD
   → Es diferente a MOD-03 que se eliminó (ese era lectura de calendario/correos)
```

**Cloud Function para correo:**
```python
# functions/notificaciones.py
async def enviar_correo_asignacion(docente_email, actividad):
    """
    Envía correo institucional via Microsoft Graph API cuando
    el director asigna una nueva actividad al docente.
    Requiere: permiso Mail.Send en Azure AD (diferente a Mail.Read de MOD-03)
    """
    endpoint = "https://graph.microsoft.com/v1.0/users/{sender}/sendMail"
    payload = {
        "message": {
            "subject": f"[UIDE] Nueva actividad asignada: {actividad['titulo']}",
            "body": {
                "contentType": "HTML",
                "content": f"""
                    <p>Hola {actividad['docente_nombre']},</p>
                    <p>Se te ha asignado una nueva actividad:</p>
                    <ul>
                        <li><b>Actividad:</b> {actividad['titulo']}</li>
                        <li><b>Categoría:</b> {actividad['categoria_ces']}</li>
                        <li><b>Prioridad:</b> {actividad['prioridad']}</li>
                        <li><b>Fecha límite:</b> {actividad['fecha_limite']}</li>
                    </ul>
                    <p>Ingresa al sistema para ver los detalles.</p>
                """
            },
            "toRecipients": [{"emailAddress": {"address": docente_email}}]
        }
    }
    # Token del sistema (cuenta institucional sender), no del docente
```

**Nota importante:** Este correo usa una cuenta remitente institucional (ej. sistema@uide.edu.ec),
NO el token del docente. Requiere coordinar con TI de UIDE el permiso `Mail.Send`
en la app registration de Azure AD. Pendiente igual que otras credenciales.

---

## 16. VISTA DEL DIRECTOR — PANEL DE ACTIVIDADES (complemento)

El director ve el espejo de lo anterior pero para TODOS sus docentes:

```
┌─────────────────────────────────────────────────────────┐
│  ACTIVIDADES ASIGNADAS — Período Mayo–Agosto 2026       │
│                                                         │
│  [Filtro docente ▼] [Filtro categoría ▼] [Estado ▼]   │
├─────────────────────────────────────────────────────────┤
│  RESUMEN GLOBAL                                         │
│  Total asignadas: 18  ·  Completadas: 9  ·  Vencidas: 2│
│  [████████░░] 50% completado general                    │
├─────────────────────────────────────────────────────────┤
│  POR DOCENTE                                            │
│                                                         │
│  Milton Palacios          5 asignadas · 3 completadas  │
│  🔴 Artículo Q2 · URGENTE · vence 20 jun               │
│  🟡 Informe PC · NORMAL · vence 30 jun                 │
│  ✅ Notas parciales · completada 10 jun · evidencia ✓  │
│                                                         │
│  Yeferson Torres          3 asignadas · 1 completada   │
│  ...                                                    │
├─────────────────────────────────────────────────────────┤
│  [+ Nueva actividad]                                    │
└─────────────────────────────────────────────────────────┘
```
