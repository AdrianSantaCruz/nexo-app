import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartProvider.jsx'
import { ModeProvider } from './context/ModeProvider.jsx'
import { NotificationsProvider } from './context/NotificationsProvider.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <ModeProvider>
            <CartProvider>
              <NotificationsProvider>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
              </NotificationsProvider>
            </CartProvider>
          </ModeProvider>
        </AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
)
