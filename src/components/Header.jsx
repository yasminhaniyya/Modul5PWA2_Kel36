import { useState, useEffect } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import cartService from '../services/cartService'

const NAV_ITEMS = [
  { id: 'Catalog', label: 'Catalog' },
  { id: 'Favorites', label: 'Favorites', hasBadge: true },
  { id: 'Profile', label: 'Profile' },
]

function Header({ tab, onTab, onNavigateCreate, onOpenCart }) {
  const { favorites } = useFavorites()
  const favCount = favorites ? favorites.length : 0

  const [cartCount, setCartCount] = useState(() => cartService.getCartItemCount())

  useEffect(() => {
    const handleCartUpdate = () => {
      setCartCount(cartService.getCartItemCount())
    }
    window.addEventListener('cart-updated', handleCartUpdate)
    return () => window.removeEventListener('cart-updated', handleCartUpdate)
  }, [])

  return (
    <header className="header">
      <div
        className="header-brand-wrap"
        onClick={() => onTab('Catalog')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <div className="header-logo-badge">
          <img src="/logo.png" alt="Bore & Barrel" />
        </div>
        <span className="brand display">Bore &amp; Barrel</span>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'nav-link active' : 'nav-link'}
            onClick={() => onTab(item.id)}
          >
            {item.label}
            {item.hasBadge && favCount > 0 && (
              <span className="nav-badge">{favCount}</span>
            )}
          </button>
        ))}

        {/* Cart button */}
        <button
          type="button"
          className="nav-link"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={onOpenCart}
          title="Open Shopping Cart"
        >
          <ShoppingCart size={16} />
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="nav-badge" style={{ background: '#25D366', color: '#fff' }}>
              {cartCount}
            </span>
          )}
        </button>
      </nav>

      {onNavigateCreate && (
        <button
          type="button"
          className="btn btn--primary btn--sm header-cta"
          onClick={onNavigateCreate}
          title="Register new hardware"
        >
          <Plus size={15} /> Add Hardware
        </button>
      )}
    </header>
  )
}

export default Header
