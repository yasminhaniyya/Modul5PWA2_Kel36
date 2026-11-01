import { useState, useEffect, useRef } from 'react'

/**
 * LazyImage — loads image only when scrolled into the viewport using IntersectionObserver.
 * Features:
 *   - IntersectionObserver viewport detection (scroll lazy-loading)
 *   - Category SVG fallback on broken URL
 *   - Skeleton placeholder with smooth fade-in animation
 */
export default function LazyImage({
  src,
  alt = '',
  className = '',
  category = 'Pistol',
  width,
  height,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)

  const catStr = (category || '').toLowerCase()
  const fallbackSrc = catStr.includes('rifle')
    ? '/guns/rifle.svg'
    : catStr.includes('shotgun')
    ? '/guns/shotgun.svg'
    : '/guns/pistol.svg'

  const effectiveSrc = hasError || !src ? fallbackSrc : src

  useEffect(() => {
    // If IntersectionObserver is not supported, load immediately
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '120px 0px', // trigger slightly before entering viewport
        threshold: 0.01,
      },
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [src])

  return (
    <div
      ref={imgRef}
      className={`lazy-img-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--mantle, #18222c)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
      }}
    >
      {/* Skeleton pulse placeholder while loading or not visible */}
      {(!isVisible || !isLoaded) && (
        <div
          className="lazy-skeleton-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-pulse 1.6s infinite ease-in-out',
          }}
        />
      )}

      {isVisible && (
        <img
          src={effectiveSrc}
          alt={alt}
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            if (!hasError) {
              setHasError(true)
              setIsLoaded(true)
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transition: 'opacity 0.35s ease-in-out, transform 0.35s ease',
            opacity: isLoaded ? 1 : 0,
          }}
        />
      )}
    </div>
  )
}
