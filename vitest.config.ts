import { defineConfig, type Plugin } from 'vitest/config'
import path from 'path'
import esbuild from 'esbuild'

// Minimal JSX transform plugin for vitest (compatible with vite 7)
function reactJsxPlugin(): Plugin {
  return {
    name: 'react-jsx-transform',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\.[jt]sx?$/.test(id) || id.includes('node_modules')) return
      if (!/[<>]|React|jsx/.test(code) && !/\.tsx?$/.test(id)) return
      const result = await esbuild.transform(code, {
        loader: id.endsWith('.tsx') ? 'tsx' : id.endsWith('.ts') ? 'ts' : id.endsWith('.jsx') ? 'jsx' : 'js',
        jsx: 'automatic',
        jsxImportSource: 'react',
        target: 'es2022',
      })
      return { code: result.code, map: result.map }
    },
  }
}

export default defineConfig({
  plugins: [reactJsxPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    env: {
      LOCAL_MODE: 'true',
      GEMINI_API_KEY: 'test-key-vitest',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
