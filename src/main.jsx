import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'flowbite/dist/flowbite.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import './i18n.jsx'
import { AppProvider } from './Context.jsx'

// Console logging is enabled

// Optional: clear storage when ?clearStorage=1 is present
if (typeof window !== 'undefined') {
  try {
    const qs = new URLSearchParams(window.location.search)
    if (qs.has('clearStorage') || qs.get('clearStorage') === '1') {
      localStorage.clear()
      sessionStorage.clear()
    }
  } catch (e) {
    console.error('Storage tozalashda xatolik:', e)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
)
