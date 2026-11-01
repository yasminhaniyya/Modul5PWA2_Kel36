import { useState, useEffect } from 'react'
import { X, Trash2, MessageSquare, ShoppingBag, Plus, Minus } from 'lucide-react'
import cartService from '../../services/cartService'
import userService from '../../services/userService'

export default function CartDrawer({ open, onClose }) {
  const [cart, setCart] = useState(() => cartService.getCart())
  const [phone, setPhone] = useState(() => localStorage.getItem('wa_checkout_phone') || '082329191645')
  const [customerName, setCustomerName] = useState(() => {
    const prof = userService.getUserProfile()
    return prof?.username || ''
  })

  const syncCart = () => {
    setCart(cartService.getCart())
  }

  useEffect(() => {
    window.addEventListener('cart-updated', syncCart)
    return () => window.removeEventListener('cart-updated', syncCart)
  }, [])

  if (!open) return null

  const total = cartService.getCartTotal()

  const handleQty = (gunId, delta) => {
    const updated = cartService.updateQuantity(gunId, delta)
    setCart(updated)
  }

  const handleRemove = (gunId) => {
    const updated = cartService.removeFromCart(gunId)
    setCart(updated)
  }

  const handleCheckoutWA = () => {
    if (cart.length === 0) return
    localStorage.setItem('wa_checkout_phone', phone)
    const waUrl = cartService.generateWhatsAppUrl(phone, customerName)
    window.open(waUrl, '_blank')
  }

  return (
    <div className="cart-backdrop" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="var(--brass)" />
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Armory Cart ({cart.length})</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="state-box" style={{ padding: '40px 10px' }}>
              <ShoppingBag size={40} stroke="var(--steel)" />
              <p>Your armory cart is empty.</p>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={onClose}
              >
                Browse Hardware
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id || item.name} className="cart-item">
                <img
                  src={item.image_url || '/guns/pistol.svg'}
                  alt={item.name}
                  className="cart-item-img"
                  onError={(e) => { e.currentTarget.src = '/guns/pistol.svg' }}
                />
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.name}</div>
                  <div className="cart-item-price">${(item.price * item.quantity).toLocaleString()}</div>
                  <div className="cart-item-qty">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => handleQty(item.id || item.name, -1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.9rem', minWidth: '18px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => handleQty(item.id || item.name, 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => handleRemove(item.id || item.name)}
                  title="Remove item"
                  style={{ color: '#c0392b' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal">
              <span>Total Price:</span>
              <span style={{ color: 'var(--brass)' }}>${total.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--steel)' }}>
                Target WhatsApp Number:
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: '4px', padding: '6px 10px', fontSize: '0.88rem' }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="082329191645"
                />
              </label>

              <label style={{ fontSize: '0.8rem', color: 'var(--steel)' }}>
                Your Callsign / Name:
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: '4px', padding: '6px 10px', fontSize: '0.88rem' }}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Shooter"
                />
              </label>
            </div>

            <button
              type="button"
              className="wa-checkout-btn"
              onClick={handleCheckoutWA}
            >
              <MessageSquare size={18} />
              Checkout via WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
