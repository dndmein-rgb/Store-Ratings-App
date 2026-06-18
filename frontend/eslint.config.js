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
      // This experimental rule flags the standard "setLoading(true) then fetch"
      // pattern used for data-loading effects throughout this app. We set loading
      // state deliberately and guard against stale updates with a cleanup flag,
      // so this is intentional rather than something to refactor around.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
