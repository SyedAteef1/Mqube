import { defineConfig } from 'vitest/config';

process.env.DATABASE_PROVIDER = 'memory';
process.env.NODE_ENV = 'test';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'src/tests/about.test.ts'],
  },
});
