import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  Share2,
  ShoppingCart,
  Check,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import {
  useReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'
import cartService from '../../services/cartService'
import reviewVoteService from '../../services/reviewVoteService'

/**
 * Full-screen product detail view with:
 *   - Multi-image gallery (thumbnails + main view)
 *   - Unique link share button
 *   - Add to Cart with quantity picker
 *   - Full Review CRUD (Create, Read, Edit, Delete)
 *   - Thumbs up / Thumbs down vote buttons on reviews
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete, onShareNotification }) {
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Multi-image list
  const imageList = (() => {
    const list = []
    if (Array.isArray(gun.images) && gun.images.length > 0) {
      list.push(...gun.images)
    } else if (typeof gun.image_url === 'string') {
      if (gun.image_url.includes(',')) {
        list.push(...gun.image_url.split(',').map((s) => s.trim()))
      } else {
        list.push(gun.image_url)
      }
    } else if (gun.image) {
      list.push(gun.image)
    }

    if (list.length === 0) {
      list.push('/guns/pistol.svg')
    }

    // Add category fallback as secondary perspective if only 1 image
    const catFallback =
      (gun.type || '').toLowerCase().includes('rifle')
        ? '/guns/rifle.svg'
        : (gun.type || '').toLowerCase().includes('shotgun')
        ? '/guns/shotgun.svg'
        : '/guns/pistol.svg'

    if (list.length === 1 && list[0] !== catFallback) {
      list.push(catFallback)
    }

    return Array.from(new Set(list))
  })()

  const [activeImgIndex, setActiveImgIndex] = useState(0)
  const currentImg = imageList[activeImgIndex] || imageList[0]

  // Cart quantity
  const [qty, setQty] = useState(1)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

  // Reviews
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const { updateReview, loading: updatingReview } = useUpdateReview()
  const { deleteReview, loading: deletingReview } = useDeleteReview()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Editing review state
  const [editingRevId, setEditingRevId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')

  // Review votes trigger
  const [, setVoteTick] = useState(0)

  useEffect(() => {
    const handleVotes = () => setVoteTick((t) => t + 1)
    window.addEventListener('review-votes-updated', handleVotes)
    return () => window.removeEventListener('review-votes-updated', handleVotes)
  }, [])

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?gun=${encodeURIComponent(gun.id || gun.name)}`
    const shareData = {
      title: `${gun.name} — Bore & Barrel Armory`,
      text: `Take a look at ${gun.name} specifications on Bore & Barrel Armory:`,
      url: shareUrl,
    }

    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        if (err.name !== 'AbortError') {
          // continue to fallback
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareSuccess(true)
      if (onShareNotification) {
        onShareNotification(`Unique link for "${gun.name}" copied to clipboard!`)
      }
      setTimeout(() => setShareSuccess(false), 2000)
    } catch {
      prompt('Copy this link:', shareUrl)
    }
  }

  const handleAddToCart = () => {
    cartService.addToCart(gun, qty)
    setCartSuccess(true)
    if (onShareNotification) {
      onShareNotification(`Added ${qty}x "${gun.name}" to cart.`)
    }
    setTimeout(() => setCartSuccess(false), 2000)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_identifier: getUserIdentifier(),
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Review submitted!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  const handleStartEditReview = (rev) => {
    setEditingRevId(rev.id)
    setEditRating(rev.rating)
    setEditComment(rev.comment || '')
  }

  const handleSaveEditReview = async (revId) => {
    const ok = await updateReview(revId, {
      rating: editRating,
      comment: editComment.trim(),
    })
    if (ok) {
      setEditingRevId(null)
      refetchReviews()
    } else {
      alert('Failed to update review.')
    }
  }

  const handleDeleteReviewItem = async (revId) => {
    if (window.confirm('Delete your review?')) {
      const ok = await deleteReview(revId)
      if (ok) {
        refetchReviews()
      } else {
        alert('Failed to delete review.')
      }
    }
  }

  const handleVote = (revId, type) => {
    reviewVoteService.vote(revId, type)
    setVoteTick((t) => t + 1)
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-gallery">
          <img
            className="detail-img"
            src={currentImg}
            alt={gun.name}
            onError={(e) => {
              const fallback =
                category === 'Rifle'
                  ? '/guns/rifle.svg'
                  : category === 'Shotgun'
                  ? '/guns/shotgun.svg'
                  : '/guns/pistol.svg'
              if (e.currentTarget.src !== fallback && !e.currentTarget.src.endsWith(fallback)) {
                e.currentTarget.src = fallback
              }
            }}
          />

          {/* Multi-Image Thumbnails (Point 9) */}
          {imageList.length > 1 && (
            <div className="detail-gallery-thumbs">
              {imageList.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`gallery-thumb ${idx === activeImgIndex ? 'active' : ''}`}
                  onClick={() => setActiveImgIndex(idx)}
                >
                  <img
                    src={imgUrl}
                    alt={`View ${idx + 1}`}
                    onError={(e) => {
                      e.currentTarget.src = '/guns/pistol.svg'
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          {/* Cart Quantity + Purchase */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                background: '#fff',
              }}
            >
              <button
                type="button"
                className="qty-btn"
                style={{ border: 'none' }}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus size={14} />
              </button>
              <span style={{ padding: '0 12px', fontWeight: 600 }}>{qty}</span>
              <button
                type="button"
                className="qty-btn"
                style={{ border: 'none' }}
                onClick={() => setQty((q) => q + 1)}
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              type="button"
              className="btn btn--primary"
              onClick={handleAddToCart}
            >
              {cartSuccess ? <><Check size={16} /> Added to Cart</> : <><ShoppingCart size={16} /> Add to Cart</>}
            </button>
          </div>

          <div className="detail-actions">
            {/* Share link button */}
            <button
              type="button"
              className="btn btn--outline"
              onClick={handleShare}
              title="Share unique link"
            >
              {shareSuccess ? <><Check size={16} color="var(--brass)" /> Copied!</> : <><Share2 size={16} /> Share</>}
            </button>

            <FavoriteButton gunId={gun.id || gun.name} />

            {onEdit && (
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => onEdit(gun)}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => onDelete(gun)}
              >
                Archive / Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Steps */}
      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>{step.instruction || step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section with CRUD and Voting */}
      <section className="detail-section">
        <h2>Reviews &amp; Field Reports</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a field review (qualification, reliability, ergonomics)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Reviews require a server-generated product ID.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => {
              const voteData = reviewVoteService.getReviewVoteData(rev.id)
              const isEditingThis = editingRevId === rev.id

              return (
                <li key={rev.id} className="review-item">
                  <div className="review-head">
                    <span className="review-user">{rev.user_identifier || 'Operator'}</span>

                    {/* Star display or edit star picker */}
                    {!isEditingThis ? (
                      <span className="review-stars-display">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < rev.rating ? 'var(--brass)' : 'none'}
                            stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                          />
                        ))}
                      </span>
                    ) : (
                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="star-btn"
                            onClick={() => setEditRating(n)}
                          >
                            <Star
                              size={16}
                              fill={n <= editRating ? 'var(--brass)' : 'none'}
                              stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comment or Edit Textarea */}
                  {!isEditingThis ? (
                    <p className="review-comment">{rev.comment || 'No written comment.'}</p>
                  ) : (
                    <div style={{ marginTop: '10px' }}>
                      <textarea
                        className="review-input"
                        rows="2"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          disabled={updatingReview}
                          onClick={() => handleSaveEditReview(rev.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => setEditingRevId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer: Voting & Actions */}
                  <div className="review-footer">
                    <div className="review-votes">
                      {/* Thumbs Up Button */}
                      <button
                        type="button"
                        className={`vote-btn ${voteData.myVote === 'up' ? 'active-up' : ''}`}
                        onClick={() => handleVote(rev.id, 'up')}
                        title="Helpful / Thumbs Up"
                      >
                        <ThumbsUp size={13} />
                        <span>{voteData.up}</span>
                      </button>

                      {/* Thumbs Down Button */}
                      <button
                        type="button"
                        className={`vote-btn ${voteData.myVote === 'down' ? 'active-down' : ''}`}
                        onClick={() => handleVote(rev.id, 'down')}
                        title="Not Helpful / Thumbs Down"
                      >
                        <ThumbsDown size={13} />
                        <span>{voteData.down}</span>
                      </button>
                    </div>

                    {/* Review CRUD Management */}
                    <div className="review-mgmt-actions">
                      {!isEditingThis && (
                        <button
                          type="button"
                          className="review-edit-btn"
                          onClick={() => handleStartEditReview(rev)}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        className="review-del-btn"
                        onClick={() => handleDeleteReviewItem(rev.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first to field test!</p>
        )}
      </section>
    </div>
  )
}
