import { useState } from 'react'
import { Share2, ShoppingCart, Check } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import LazyImage from '../common/LazyImage'
import { formatPrice, truncate } from '../../utils/helpers'
import cartService from '../../services/cartService'

/**
 * Product card used in the catalog grid with Lazy Loading, Share, and Cart buttons.
 */
export default function GunCard({ gun, onSelect, onEdit, onDelete, onShareNotification }) {
  const [copied, setCopied] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || 'Hardware'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  const handleShare = async (e) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}${window.location.pathname}?gun=${encodeURIComponent(gun.id || gun.name)}`
    const shareData = {
      title: `${gun.name} — Bore & Barrel Armory`,
      text: `Check out the ${gun.name} (${category}, ${caliber}) at Bore & Barrel Armory:`,
      url: shareUrl,
    }

    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        if (err.name !== 'AbortError') {
          // fallback to clipboard
        }
      }
    }

    // Fallback: clipboard copy
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      if (onShareNotification) {
        onShareNotification(`Unique link for "${gun.name}" copied to clipboard!`)
      }
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('Copy this link:', shareUrl)
    }
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    cartService.addToCart(gun, 1)
    setAddedToCart(true)
    if (onShareNotification) {
      onShareNotification(`Added "${gun.name}" to cart.`)
    }
    setTimeout(() => setAddedToCart(false), 1800)
  }

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`View ${gun.name}`}
      >
        <LazyImage
          src={imgSrc}
          alt={gun.name}
          category={category}
          width={240}
          height={180}
          className="card-img"
        />

        <span className="name display">{gun.name}</span>

        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>

        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}

        <span className="price">{formatPrice(price)}</span>
      </button>

      {/* Floating actions row */}
      <div className="card-actions">
        {/* Add to Cart button */}
        <button
          type="button"
          className="card-act-btn"
          onClick={handleAddToCart}
          title={addedToCart ? 'Added!' : 'Add to Cart'}
          aria-label="Add to cart"
        >
          {addedToCart ? <Check size={14} color="var(--brass)" /> : <ShoppingCart size={14} />}
        </button>

        {/* Share link button */}
        <button
          type="button"
          className="card-act-btn"
          onClick={handleShare}
          title={copied ? 'Link Copied!' : 'Share hardware via unique link'}
          aria-label="Share hardware link"
        >
          {copied ? <Check size={14} color="var(--brass)" /> : <Share2 size={14} />}
        </button>

        {/* Favorite button */}
        <FavoriteButton gunId={gun.id || gun.name} />

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(gun)
            }}
            aria-label={`Edit ${gun.name}`}
            title="Edit"
          >
            ✏️
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(gun)
            }}
            aria-label={`Delete ${gun.name}`}
            title="Archive / Delete"
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  )
}
