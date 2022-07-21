import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '照片相机水印处理',
  },
  history: { type: 'hash' },
  hash: true,
  routes: [
    {
      name: '照片相机水印处理',
      path: '/',
      component: './Home',
    },
  ],
  npmClient: 'pnpm',
});

