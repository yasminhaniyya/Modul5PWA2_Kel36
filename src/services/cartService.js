// ---------------------------------------------------------------------------
// cartService.js — shopping cart state persisted in localStorage with WA checkout
// ---------------------------------------------------------------------------

const CART_KEY = 'bore_barrel_cart'

class CartService {
  getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart))
      window.dispatchEvent(new Event('cart-updated'))
      return true
    } catch {
      return false
    }
  }

  addToCart(gun, quantity = 1) {
    const cart = this.getCart()
    const gunId = gun.id || gun.name
    const existingIndex = cart.findIndex((item) => (item.id || item.name) === gunId)

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity
    } else {
      cart.push({
        id: gun.id,
        name: gun.name,
        price: Number(gun.price ?? gun.cook_time ?? 0),
        type: gun.type || gun.category || 'Hardware',
        image_url: gun.image_url || gun.image || '/guns/pistol.svg',
        quantity,
      })
    }
    this.saveCart(cart)
    return cart
  }

  updateQuantity(gunId, delta) {
    const cart = this.getCart()
    const item = cart.find((i) => (i.id || i.name) === gunId)
    if (!item) return cart

    item.quantity += delta
    const updated = item.quantity <= 0 ? cart.filter((i) => (i.id || i.name) !== gunId) : cart
    this.saveCart(updated)
    return updated
  }

  removeFromCart(gunId) {
    const cart = this.getCart().filter((i) => (i.id || i.name) !== gunId)
    this.saveCart(cart)
    return cart
  }

  clearCart() {
    this.saveCart([])
    return []
  }

  getCartTotal() {
    const cart = this.getCart()
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  getCartItemCount() {
    const cart = this.getCart()
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  generateWhatsAppUrl(phoneNumber = '6281234567890', customerName = '') {
    const cart = this.getCart()
    if (cart.length === 0) return ''

    const cleanPhone = String(phoneNumber).replace(/[^0-9]/g, '')
    const total = this.getCartTotal()

    const itemLines = cart
      .map(
        (item) =>
          `• ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toLocaleString()}`,
      )
      .join('\n')

    const greeting = customerName ? `Hi, aku ${customerName}. Aku mau pesan:` : 'Hi aku mau pesan:'

    const text = `${greeting}\n\n${itemLines}\n\nTotal: $${total.toLocaleString()}\n\nMohon konfirmasi ketersediaan dan invoice. Terima kasih!`

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
  }
}

export default new CartService()
