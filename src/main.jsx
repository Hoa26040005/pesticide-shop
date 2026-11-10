import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import App from './App.jsx'

const themeConfig = {
  token: {
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    colorPrimary: '#059669',
    colorPrimaryHover: '#10b981',
    colorPrimaryActive: '#047857',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#0ea5e9',
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,
    colorBgLayout: '#f6f8f7',
    colorTextBase: '#0f172a',
    colorTextSecondary: '#64748b',
    colorBorderSecondary: '#f1f5f9',
    wireframe: false,
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 38,
      fontWeight: 600,
    },
    Card: {
      borderRadiusLG: 14,
      boxShadowTertiary: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    },
    Table: {
      borderRadiusLG: 12,
      headerBg: '#f8fafc',
      headerColor: '#475569',
      rowHoverBg: '#f0fdf4',
    },
    Menu: {
      itemBorderRadius: 8,
      itemMarginInline: 10,
      itemSelectedBg: 'rgba(5, 150, 105, 0.12)',
      itemSelectedColor: '#059669',
    },
    Modal: {
      borderRadiusLG: 16,
    },
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={themeConfig}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
