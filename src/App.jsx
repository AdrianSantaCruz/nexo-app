import { Routes, Route } from 'react-router-dom'
import SiteLayout from './components/SiteLayout'
import StorePage from './components/StorePage'
import FeedPage from './components/FeedPage'
import DiscoverPage from './components/DiscoverPage'
import ChatsPage from './components/ChatsPage'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import AccountPage from './components/AccountPage'
import CreateStorePage from './components/CreateStorePage'
import CartPage from './components/CartPage'

function App() {
  return (
    <SiteLayout>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/descubrir" element={<DiscoverPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/chats/:conversationId" element={<ChatsPage />} />
        <Route path="/tienda/:storeSlug" element={<StorePage />} />
        <Route path="/tienda/:storeSlug/producto/:productId" element={<StorePage />} />
        <Route path="/ingresar" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/cuenta" element={<AccountPage />} />
        <Route path="/vender" element={<CreateStorePage />} />
        <Route path="/carrito" element={<CartPage />} />
      </Routes>
    </SiteLayout>
  )
}

export default App
