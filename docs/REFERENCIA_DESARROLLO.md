# Referencia Rápida de Desarrollo — UIDE Distributivo App

## Comandos frecuentes

```bash
npm run dev          # Servidor de desarrollo (http://localhost:5173)
npm run build        # Build de producción en /dist
npm run preview      # Preview del build de producción

# Tests (instalar vitest primero: npm install -D vitest)
npx vitest run                    # Ejecutar todos los tests una vez
npx vitest                        # Watch mode
npx vitest --coverage             # Con reporte de cobertura
npx vitest tests/unit/calculos    # Solo tests de cálculos

# Firebase CLI
firebase deploy --only hosting         # Desplegar frontend
firebase deploy --only firestore:rules # Desplegar reglas Firestore
firebase deploy --only functions       # Desplegar Cloud Functions
firebase emulators:start               # Emulador local (Auth + Firestore + Functions)
```

## Cuentas mock de desarrollo

| Rol | Email | Password |
|---|---|---|
| Director | director@uide.edu.ec | 1234 |
| Coordinador | coordinador@uide.edu.ec | 1234 |
| Docente TC | docente.tc@uide.edu.ec | 1234 |
| Docente MT | docente.mt@uide.edu.ec | 1234 |
| Administrador | admin@uide.edu.ec | 1234 |

## Estructura de servicios por Sprint

| Sprint | Servicio | Estado |
|---|---|---|
| 0 | authService.js (mock) | ✅ |
| 1 | distributivoService.js | Pendiente |
| 1 | actividadesService.js | Pendiente |
| 2 | calendarioService.js | Pendiente |
| 3 | iaService.js | Pendiente |
| 5 | reportesService.js | Pendiente |
| 5 | notificacionesService.js | Pendiente |

## Integrations pendientes

- **Firebase**: completar `.env.local` con credenciales del proyecto
- **Azure AD**: registrar app en portal.azure.com con TIC de UIDE campus Loja
- **MSAL.js**: `npm install @azure/msal-browser @azure/msal-react` al integrar Azure AD
