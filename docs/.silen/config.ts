import { defineConfig, definePlugin } from '@aicode-nexus/silen'

const isolateSsrDependencies = definePlugin(() => ({
  name: 'audio-native:isolated-silen-ssr',
  vite: () => ({
    name: 'audio-native:bundle-silen-ssr-dependencies',
    config: () => ({ ssr: { noExternal: true } }),
  }),
}))

export default defineConfig({
  title: 'React Audio Native',
  description:
    'React DOM audio player documentation, architecture map and browser/WebView knowledge base.',
  lang: 'zh-CN',
  base: '/react-audio-native/',
  siteUrl: 'https://trsoliu.github.io',
  onBrokenLinks: 'error',
  plugins: [isolateSsrDependencies],
  themeConfig: {
    locales: [
      { lang: 'zh-CN', label: '中文', root: '/' },
      {
        lang: 'en-US',
        label: 'English README',
        link: 'https://github.com/trsoliu/react-audio-native#readme',
      },
    ],
    logo: { src: '/logo.svg', alt: 'React Audio Native' },
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started/' },
      { text: '项目地图', link: '/project-map/' },
      { text: '公共 API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/trsoliu/react-audio-native' },
    ],
    sidebar: [
      {
        text: '开始使用',
        items: [
          { text: '文档首页', link: '/' },
          { text: '安装与快速开始', link: '/guide/getting-started/' },
          { text: '公共 API', link: '/api/' },
          { text: 'Vue → React 迁移', link: '/guide/vue-to-react/' },
        ],
      },
      {
        text: '工程地图',
        items: [
          { text: 'Monorepo 项目地图', link: '/project-map/' },
          { text: 'React 与 core 架构', link: '/wiki/architecture/' },
          { text: '浏览器与 WebView', link: '/wiki/browser-webview/' },
          { text: '兼容基线', link: '/compatibility/' },
        ],
      },
      {
        text: '维护与发布',
        items: [
          { text: '发布知识库', link: '/release/' },
          { text: '真机冒烟记录', link: '/device-smoke/' },
          { text: 'AI 协作说明', link: '/wiki/ai-collaboration/' },
          { text: '架构决策', link: '/adr/0001-react-audio-adapter/' },
          { text: '首发发布决策', link: '/adr/0002-bootstrap-npm-publishing/' },
        ],
      },
    ],
    search: true,
    home: {
      hero: {
        name: 'React Audio Native',
        text: 'React DOM 的完整音频能力，不是 React Native SDK。',
        tagline:
          'StrictMode 与 SSR 安全、事件驱动、完整 TypeScript，并与 Vue 版本共享同一音频状态契约。',
        image: { src: '/logo.svg', alt: 'React Audio Native waveform mark' },
        actions: [
          { text: '开始接入', link: '/guide/getting-started/', theme: 'brand' },
          { text: '查看项目地图', link: '/project-map/', theme: 'alt' },
        ],
      },
      features: [
        {
          title: '同一 audio-core 契约',
          details:
            '播放、列表、缓冲、错误、互斥和宿主 Bridge 与 Vue 版本保持一致。',
          link: '/wiki/architecture/',
          linkText: '理解架构',
        },
        {
          title: 'React 与 SSR 原生写法',
          details: 'forwardRef、callback ref、订阅式不可变快照和无副作用导入。',
          link: '/api/',
          linkText: '查看公共 API',
        },
        {
          title: 'AI-ready 知识库',
          details:
            '同一构建生成搜索、Markdown、llms.txt、Agent Contract 与只读 MCP。',
          link: '/wiki/ai-collaboration/',
          linkText: '查看 AI 协作边界',
        },
      ],
    },
  },
  ai: {
    llmsTxt: true,
    llmsFullTxt: true,
    markdownRoutes: true,
    index: true,
    contract: {
      enabled: true,
      instructions: '.silen/ai-public.md',
      tasksDir: '.silen/ai-tasks',
    },
  },
})
