import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Convención del proyecto: _ marca descartes intencionales en
      // destructuring, parámetros y catch (p. ej. const { password: _, ...x }).
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      // Deuda conocida (no bugs): el patrón de carga mock hace setState
      // dentro de useEffect en varias páginas. Refactor planificado al
      // conectar Firebase real (los efectos pasan a onSnapshot/suspense).
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      // Los contexts exportan { Context, Provider } juntos (patrón estándar);
      // solo afecta la granularidad del HMR en desarrollo, no a producción.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
