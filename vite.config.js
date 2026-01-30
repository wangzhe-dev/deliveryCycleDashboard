/*
 * @Author: zhaijs
 * @Date: 2023-07-28 11:21:43
 * @LastEditTime: 2025-09-06 15:29:52
 * @Description: 请填写简介
 */
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import createVitePlugins from './vite/plugins';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());
  const { VITE_APP_BASE } = env;
  return {
    // 部署生产环境和开发环境下的URL。
    // 默认情况下，vite 会假设你的应用是被部署在一个域名的根路径上
    // 例如 https://www.jne.vip/。如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。例如，如果你的应用被部署在 https://www.jne.vip/admin/，则设置 baseUrl 为 /admin/。
    base: VITE_APP_BASE || '/',
    plugins: createVitePlugins(env, command === 'build'),
    resolve: {
      // https://cn.vitejs.dev/config/#resolve-alias
      alias: {
        // 设置路径
        '~': path.resolve(__dirname, './'),
        // 设置别名
        '@': path.resolve(__dirname, './src'),
      },
      // https://cn.vitejs.dev/config/#resolve-extensions
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    // vite 相关配置
    server: {
      port: 80,
      host: true,
      open: true,
      // hmr: false,
      proxy: {
        // https://cn.vitejs.dev/config/#server-proxy
        '/dev-api': {
          // target: 'http://172.168.20.11:8080',
          //  target: 'http://172.168.20.38:8080',
          // target: 'http://192.168.40.163:8080',
          // target: 'http://192.168.40.134:8080',
          // target: 'http://192.168.40.107:8080',
          // target: 'http://114.246.242.73:8082',
          // target: 'http://111.198.29.89:18080/prod-api',
          // ====================================================
          // uat
          // target: 'http://10.147.128.85:80/prod-api',
          // 客户生产
          // target: 'http://10.147.128.114:8080',
          // target: 'http://192.168.20.103:8080',
          // 北京环境外网
          // target: 'http://150.129.138.47:18000',
          target: 'http://10.147.128.85:80/prod-api',
          // 北京环境
          // target: 'http://192.168.20.38:8080',
          // target: 'http://192.168.20.104:8080',
          // target: 'http://192.168.20.111:8080',

          // target: 'http://192.168.20.101:8080',
          // target: 'http://192.168.20.103:8080',

          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/dev-api/, ''), // /prod-api/
        },
      },
    },
    //fix:error:stdin>:7356:1: warning: "@charset" must be the first rule in the file
    css: {
      postcss: {
        plugins: [
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === 'charset') {
                  atRule.remove();
                }
              },
            },
          },
        ],
      },
    },
  };
});
