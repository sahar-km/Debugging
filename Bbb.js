import { defineConfig } from 'vitepress'
import footnote from 'markdown-it-footnote'
import mathjax3 from 'markdown-it-mathjax3'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/windows-activation/',
  cleanUrls: true,
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/NiREvil/windows-activation/docs/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'windows and office ' }],
    ['meta', { property: 'og:description', content: 'activating methods, Change license' }]
  ],

  markdown: {
    config: (md) => {
      md.use(footnote)
      md.use(mathjax3)
    },
    lineNumbers: true
  },

  // --- I18n Configuration ---
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      title: 'REvil Activator',
      description: 'Instant Windows and Office Activation Tools',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Guides', link: '/en/index' }
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Activation Guides',
              collapsed: false,
              items: [
                { text: 'Introduction', link: '/en/index' },
                { text: 'KMS Activation', link: '/en/kms' },
              ]
            },
            {
              text: 'Technical Details',
              collapsed: true,
              items: [
                { text: 'Methods Chart', link: '/en/chart' },
                { text: 'HWID (Digital License)', link: '/en/hwid' },
                { text: 'KMS38', link: '/en/kms38' },
                { text: 'TSforge', link: '/en/tsforge' },
                { text: '$OEM$ Folders (Pre-activation)', link: '/en/oem-folder' },
              ]
            },
            {
              text: 'Advanced Guides',
              collapsed: true,
              items: [
                { text: 'Clean Install Windows', link: '/en/clean_install_windows' },
                { text: 'Office C2R Custom Install', link: '/en/office_c2r' },
                { text: 'Fix WPA Registry', link: '/en/fix-wpa-registry' },
                { text: 'Remove Malware', link: '/en/remove_malware' },
              ]
            }
          ]
        },
        editLink: {
          pattern: 'https://github.com/NiREvil/windows-activation/edit/main/docs/:path',
          text: 'Edit this page on GitHub'
        },
      }
    },
    fa: {
      label: 'فارسی',
      lang: 'fa',
      dir: 'rtl',
      title: 'فعال‌ساز REvil',
      description: 'ابزارهای فعال‌سازی فوری ویندوز و آفیس',
      themeConfig: {
        nav: [
          { text: 'خانه', link: '/fa/' },
          { text: 'راهنما', link: '/fa/README-FA' }
        ],
        sidebar: {
          '/fa/': [
            {
              text: 'راهنمای فعال‌سازی',
              collapsed: false,
              items: [
                { text: 'مقدمه و آموزش (فارسی)', link: '/fa/README-FA' },
                // Note: Add other translated files here later
              ]
            }
          ]
        },
        search: {
      provider: 'local'
    },

    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },
        editLink: {
          pattern: 'https://github.com/sahar-km/AEG/edit/main/docs/:path',
          text: 'این صفحه را در گیت‌هاب ویرایش کنید'
        },
      }
    }
  },

  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/NiREvil/windows-activation' },
      { icon: 'telegram', link: 'https://t.me/F_NiREvil/6448' }
    ],
    footer: {
      message: 'Made with 🩶 using VitePress',
      copyright: '© 2025 REvil - Sharing knowledge, one note at a time'
    }
  }
})
