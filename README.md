# UIDE Distributivo Académico

Aplicación web con Inteligencia Artificial para la **gestión y seguimiento del
distributivo académico** del personal docente y administrativo de la
Universidad Internacional del Ecuador (UIDE) — Campus Loja.

> Trabajo de Titulación · Ingeniería en Tecnologías de la Información
> Autor: Danny Francisco Jaramillo Guachón (dajaramillogu@uide.edu.ec)

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS (SPA, code-splitting por ruta) |
| Backend | Firebase: Auth (Microsoft Azure AD), Firestore, Cloud Functions (Python 3.11), Hosting |
| Integraciones | Microsoft Graph API (MSAL), Twilio WhatsApp, Claude API |
| IA | Clasificación NLP de actividades (heurística + BETO fine-tuned) |

## Inicio rápido

```bash
npm install
cp .env.example .env.local   # completar credenciales (ver comentarios del archivo)
npm run dev                  # http://localhost:5173
```

Sin credenciales externas la aplicación opera en **modo demostración** (mock):
login de desarrollo, datos seed en localStorage y todas las integraciones
simuladas con el mismo contrato de datos que las reales.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (`dist/`) |
| `npm test` | Suite de pruebas (Vitest) |
| `npm run lint` | ESLint |
| `firebase deploy --only functions` | Despliega las Cloud Functions (Python) |
| `firebase deploy --only hosting` | Despliega la SPA |

## Documentación

- **`PROJECT.md`** — fuente de verdad: requerimientos (RF/RNF), módulos,
  reglas de negocio, colecciones Firestore, plan de sprints y decisiones técnicas.
- `functions/clasificacion/` — pipeline IA: clasificador heurístico,
  `generar_dataset.py` y `entrenar.py` (fine-tuning BETO, RNF-009).

## Módulos principales

Autenticación multi-rol (`roles[]`) · Distributivo con cálculo automático
(Reglamento CES 2021) · Matriz de Productividad · Mis Actividades (Kanban) ·
Calendario/correos Outlook (etiquetas `DIST/*`) · Clasificación IA ·
Notificaciones WhatsApp · Planes de mejora y oficios por incumplimiento ·
Reportes PDF/Excel institucionales · Centro de ayuda por rol.
