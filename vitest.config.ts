import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'uniapp',
    environmentOptions: {
      uniapp: {
        platform: 'mp-weixin',
        projectPath: '.',
        port: 5121,
      },
    },
  },
})
