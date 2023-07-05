import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import { env } from 'node:process'
const isProd = env.NODE_ENV === "production"

// https://vitejs.dev/config/
export default defineConfig({
  base: isProd ? '/infinite_image_browsing/fe-static' : '/', css: {
    preprocessorOptions: {
      modules: true,
      less: {
        // #d03f0a// https://github.com/vueComponent/ant-design-vue/blob/main/components/style/themes/default.less
        modifyVars: {
          'primary-color': '#d03f0a',
          'link-color': '#d03f0a',
        },
        javascriptEnabled: true,
      }
    }
  },
  plugins: [vue(),
  Components({
    resolvers: [AntDesignVueResolver({ importStyle: 'less' })],
  }),],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/infinite_image_browsing/': {
        target: 'http://127.0.0.1:7866/'
      }
    }
  }
})
