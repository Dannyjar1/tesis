# RESTRUCTURE.md — Plan de reestructuración del proyecto
> Generado: junio 2026 · Basado en directrices de tutora Lorena Conde (reunión jun 2026)
> Leer este archivo ANTES de ejecutar cualquier cambio en el proyecto

---

## RESUMEN EJECUTIVO

Tu proyecto estaba bien construido pero se salió del alcance real.
Lorena necesita 3 cosas: distributivo automático, seguimiento de actividades asignadas, y reportes.
Todo lo demás es scope creep. Este archivo dice exactamente qué hacer.

---

## FASE 1 — ELIMINAR (no tocar lo demás hasta terminar esto)

### 1.1 Carpetas completas a eliminar
```bash
rm -rf src/modules/calendario/
rm -rf src/modules/misactividades/
rm -rf src/modules/planet/
```

### 1.2 Servicios a eliminar
```bash
rm src/services/calendarioService.js
rm src/services/outlookLabelsService.js
rm src/services/misActividadesService.js
```

### 1.3 Hooks a eliminar
```bash
rm src/hooks/useCalendario.js
```

### 1.4 Cloud Functions a eliminar
```bash
rm functions/sync_outlook.py
```

### 1.5 Verificar y limpiar imports rotos
Después de eliminar, buscar y eliminar cualquier import que referencie:
- `calendarioService`
- `outlookLabelsService`
- `misActividadesService`
- `useCalendario`
- `MisActividadesPage`
- `KanbanColumna`
- `ActividadCard` (del módulo misactividades)
- `PlanetCategoria`
- `PlanetSemanaChart`
- `SyncOutlookButton`
- `CalendarioConfig`
- `CalendarioPage`

---

## FASE 2 — AJUSTAR LÓGICA DE NEGOCIO

### 2.1 Eliminar RF-043: Matriz de Productividad como prerequisito
**Archivo:** `src/modules/distributivo/DistributivoForm.jsx`
- Eliminar cualquier validación que bloquee crear un distributivo si no existe `/matriz_productividad` aprobada
- El distributivo se crea directamente con los datos base del director
- Eliminar cualquier referencia a colección `/matriz_productividad`

### 2.2 Eliminar RF-041: Validación de 2 semanas de anticipación
**Archivo:** `src/services/actividadesService.js` o donde esté implementado
- Eliminar la validación que bloquea actividades sin 2 semanas de anticipación
- Eliminar el campo `imprevista` de documentos en `/actividades` o `/tareas_todo`

### 2.3 Eliminar RF-042: Lógica de docentes compartidos entre carreras
**Archivo:** `src/utils/calculos.js` o donde esté implementado
- Eliminar la lógica de suma de horas cross-carrera
- El sistema trabaja por carrera de forma independiente

### 2.4 Eliminar WhatsApp/Twilio (RF-038)
**Archivos:**
- `functions/main.py` → eliminar imports y funciones de Twilio
- Eliminar el campo `telefono_whatsapp` de los formularios de usuario (puede quedar en Firestore schema pero no en UI)
- Las notificaciones quedan solo como in-app (FCM)

### 2.5 Eliminar oficios formales (RF-044)
- Eliminar cualquier UI o servicio para emitir oficios
- La colección `/oficios` no se crea
- Ante incumplimiento: solo notificación in-app + registro en `/notificaciones`

---

## FASE 3 — MÓDULO DE ACTIVIDADES (ajuste conceptual importante)

### El cambio de concepto
```
ANTES (MOD-09 Kanban):
  Docente crea sus propias tareas personales → las mueve en tablero Kanban
  Es un to-do list personal del docente

AHORA (según Lorena):
  Director asigna tareas a docentes → docente las ve y las completa
  Es gestión de trabajo asignado, con trazabilidad para el director
```

### 3.1 Revisar src/modules/actividades/ (o donde esté el módulo de actividades)
Verificar que el flujo sea:
- **Vista Director:** crear actividad → seleccionar docente → asignar categoría + prioridad + fechas
- **Vista Docente:** ver mis actividades asignadas → subir evidencia → marcar completada
- NO debe haber opción de que el docente cree actividades por su cuenta

### 3.2 Verificar colección /actividades en Firestore
El documento debe tener estos campos obligatorios:
```javascript
{
  asignada_por_uid: string,   // UID del director — REQUERIDO
  asignada_a_uid:   string,   // UID del docente destinatario — REQUERIDO
  prioridad:        string,   // "urgente" | "normal" | "pendiente"
  estado:           string,   // "pendiente" | "en_progreso" | "completada" | "vencida"
  evidencia_url:    string | null,
  observacion:      string | null,  // para ampliación de plazo
}
```

### 3.3 Agregar alerta de coherencia distributivo-actividad
En el servicio de creación de actividades, antes de guardar:
```javascript
// Si la categoría de la actividad no existe en el distributivo del docente → alertar
async function verificarCoherenciaDistributivo(docente_uid, categoria_actividad, periodo_id) {
  const distributivo = await getDistributivo(docente_uid, periodo_id)
  const horasCategoria = distributivo[`horas_${categoria_actividad}`]
  if (!horasCategoria || horasCategoria === 0) {
    return {
      alerta: true,
      mensaje: `El docente no tiene horas de "${categoria_actividad}" en su distributivo`
    }
  }
  return { alerta: false }
}
```

---

## FASE 4 — SIDEBAR Y RUTAS (limpiar navegación)

### 4.1 Eliminar del Sidebar
Rutas a eliminar del menú de navegación:
- `/calendario` — Outlook sync
- `/mis-actividades` o `/kanban` — tablero personal
- `/planet` — resumen visual

### 4.2 Menú resultante por rol

**Director:**
```
Dashboard | Distributivos | Actividades | IA / Clasificación | Reportes | Administración | Ayuda
```

**Coordinador:**
```
Dashboard | Distributivos (lectura) | Actividades | Reportes | Ayuda
```

**Docente:**
```
Mi Distributivo | Mis Actividades (asignadas) | Mi Perfil | Ayuda
```

**Admin:**
```
Dashboard Global | Usuarios | Carreras | Períodos | Reportes | Configuración | Auditoría | Ayuda
```

---

## FASE 5 — COLECCIONES FIRESTORE (estado final)

### Colecciones que SE USAN
```
/usuarios              ✅ — sin campo telefono_whatsapp en UI
/docentes              ✅
/carreras              ✅ — seed 7 carreras
/periodos_academicos   ✅ — con subcolecciones
/distributivos         ✅
/actividades           ✅ — ajustada a §3.2 de este archivo
/clasificaciones_ia    ✅
/notificaciones        ✅ — solo in-app
/reportes              ✅
/auditoria             ✅
/configuracion         ✅
```

### Colecciones que NO SE CREAN
```
/eventos_calendario    ❌ — era de Outlook sync
/tareas_todo           ❌ — era del Kanban personal
/matriz_productividad  ❌ — por instrucción de Lorena
/planes_mejora         ❌ — fuera de alcance MVP
/oficios               ❌ — fuera de alcance MVP
/roles_definicion      ❌ — RBAC dinámico innecesario para MVP
```

---

## FASE 6 — PRIORIDAD MVP (qué construir después de limpiar)

Una vez eliminado lo que no va, el MVP que Lorena necesita ver:

### MVP mínimo funcional
1. **Login** con Microsoft (@uide.edu.ec) → redirige por rol
2. **Director puede:**
   - Crear/editar distributivo de un docente (con cálculo automático de horas)
   - Ver que el total suma 40h / 20h correctamente
   - Asignar actividad a un docente con prioridad y fecha límite
   - Ver panel de actividades con estados
3. **Docente puede:**
   - Ver su distributivo del período activo
   - Ver sus actividades asignadas ordenadas por prioridad
   - Marcar actividad como completada
4. **Reporte básico** PDF descargable con previsualización

### Orden de trabajo sugerido para Claude Code
```
1. Ejecutar FASE 1 (eliminar archivos)
2. Limpiar imports rotos
3. Ejecutar FASE 4 (limpiar sidebar y rutas)
4. Verificar que la app compila y corre sin errores
5. Ejecutar FASE 2 (ajustar lógica de negocio)
6. Ejecutar FASE 3 (ajuste conceptual actividades)
7. Probar flujo completo: login → distributivo → actividades → reporte
8. Documentar en PROJECT_BRIEF.md cualquier decisión técnica nueva
```

---

## PROMPT PARA CLAUDE CODE CLI

Copia y pega esto al abrir Claude Code en tu proyecto:

```
Lee PROJECT_BRIEF.md y RESTRUCTURE.md antes de hacer cualquier cosa.

Resumen de lo que necesito:
1. Ejecutar la FASE 1 de RESTRUCTURE.md: eliminar los módulos/servicios/hooks 
   fuera de alcance (calendario, misactividades, planet, sync_outlook)
2. Limpiar todos los imports rotos que queden después de la eliminación
3. Verificar que la app compila sin errores
4. Limpiar el Sidebar según FASE 4 de RESTRUCTURE.md

REGLAS:
- No modificar src/utils/calculos.js bajo ninguna circunstancia
- No tocar MOD-01, MOD-02, MOD-04, MOD-05, MOD-06, MOD-08
- Ejecutar de forma autónoma sin pausas de confirmación
- Si encuentras un import ambiguo, conservar en lugar de eliminar
- Al finalizar cada fase, reportar qué se hizo y si hubo errores
```

---

*Generado a partir del análisis del PROJECT.md v1.5.0 cruzado con las directrices de la reunión con Lorena Conde (tutora de tesis) — junio 2026*

---

## ACTUALIZACIÓN — MÓDULO DE ACTIVIDADES DEL DOCENTE (jun 2026)

### Qué construir en src/modules/actividades/

#### Componentes necesarios
```
src/modules/actividades/
├── ActividadesDocentePage.jsx    # Vista principal del docente
├── ActividadCard.jsx             # Tarjeta individual de actividad
├── ProgresoCategoria.jsx         # Barra de progreso por categoría CES
├── EvidenciaModal.jsx            # Modal para subir archivo o URL
├── ActividadesDirectorPage.jsx   # Panel consolidado del director
└── NuevaActividadModal.jsx       # Modal del director para crear/asignar
```

#### ProgresoCategoria.jsx — lógica
```javascript
// Recibe el mismo array de actividades que la lista (sin fetch extra)
function ProgresoCategoria({ actividades }) {
  const categorias = ['docencia','investigacion','vinculacion','gestion']
  return categorias
    .filter(cat => actividades.some(a => a.categoria_ces === cat))
    .map(cat => {
      const total = actividades.filter(a => a.categoria_ces === cat).length
      const completadas = actividades.filter(
        a => a.categoria_ces === cat && a.estado === 'completada'
      ).length
      return { cat, total, completadas, pct: Math.round((completadas/total)*100) }
    })
}
```

#### Filtros en ActividadesDocentePage.jsx
```javascript
const FILTROS = ['todas','pendiente','en_progreso','completada','vencida']
// Estado inicial: 'todas'
// Firestore query: where('asignada_a_uid','==', user.uid)
//                  where('periodo_id','==', periodoActivo.id)
// El filtrado por estado se hace en el cliente sobre el array local
// No query adicional por estado → mismo snapshot para lista y barras de progreso
```

#### Notificación al asignar actividad (NuevaActividadModal.jsx)
```javascript
// Al guardar la actividad en Firestore:
async function crearActividad(data) {
  await addDoc(collection(db, 'actividades'), data)
  // Crear notificación in-app
  await addDoc(collection(db, 'notificaciones'), {
    destinatario_uid: data.asignada_a_uid,
    tipo: 'nueva_actividad',
    titulo: 'Nueva actividad asignada',
    mensaje: `${data.titulo} · Vence: ${formatFecha(data.fecha_limite)}`,
    leida: false,
    fecha_creacion: serverTimestamp()
  })
  // Disparar Cloud Function para correo Outlook (no bloqueante)
  await httpsCallable(functions, 'enviarCorreoAsignacion')({
    docente_uid: data.asignada_a_uid,
    actividad_id: nuevaRef.id
  })
}
```

### Permiso adicional requerido en Azure AD
```
Mail.Send (Application permission)
→ Permite enviar correos desde cuenta institucional del sistema
→ Diferente a Mail.Read (lectura) que era de MOD-03 eliminado
→ Pendiente de aprobación de TI UIDE junto con otras credenciales
→ NO bloquea el MVP: si no hay token, solo se envía notificación in-app
```
