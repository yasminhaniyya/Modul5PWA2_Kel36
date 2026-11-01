import { useState, useMemo, useEffect } from 'react'
import {
  RefreshCw,
  Plus,
  Loader,
  AlertCircle,
  PackageOpen,
  ChevronLeft,
  ChevronRight,
  Archive,
  Trash2,
  Check,
} from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import GunDetail from '../components/gun/GunDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import ConfirmModal from '../components/modals/ConfirmModal'
import gunService from '../services/gunService'
import archiveService from '../services/archiveService'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
} from '../utils/helpers'

/**
 * Catalog page with:
 *   1. Pagination (page navigation, customizable page size)
 *   2. Lazy Load images (IntersectionObserver)
 *   3. Query Caching (instant return when switching pages)
 *   4. Soft Delete / Archive support (can be restored from Profile)
 *   5. Share Link support via unique link
 */
export default function Catalog({ onNavigate }) {
  // ---- API data with Query Caching ----
  const { guns: apiGuns, loading, error, refetch } = useGuns({ limit: 100 })
  const [useLocal, setUseLocal] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  // Soft delete / archive awareness
  const [archivedIds, setArchivedIds] = useState(() =>
    archiveService.getArchivedGuns().map((g) => String(g.id || g.name)),
  )

  useEffect(() => {
    const handleArchiveUpdate = () => {
      setArchivedIds(
        archiveService.getArchivedGuns().map((g) => String(g.id || g.name)),
      )
    }
    window.addEventListener('archive-updated', handleArchiveUpdate)
    return () => window.removeEventListener('archive-updated', handleArchiveUpdate)
  }, [])

  // Decide data source & filter out soft-deleted items
  const rawGuns = useMemo(() => {
    let source = apiGuns
    if (useLocal || (error && apiGuns.length === 0)) {
      source = GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
    }
    // Exclude archived items from active catalog
    return source.filter((g) => !archivedIds.includes(String(g.id || g.name)))
  }, [apiGuns, error, useLocal, archivedIds])

  // ---- filters / sort ----
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // ---- Pagination (Point 1) ----
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8) // 8 items per page

  // Reset to page 1 on filter or sort change
  useEffect(() => {
    setPage(1)
  }, [search, activeCategory, sortKey, sortOrder, pageSize])

  const categories = useMemo(() => extractCategories(rawGuns), [rawGuns])

  const filteredGuns = useMemo(() => {
    let result = rawGuns.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [rawGuns, search, activeCategory, sortKey, sortOrder])

  // Calculate paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredGuns.length / pageSize))
  const paginatedGuns = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredGuns.slice(start, start + pageSize)
  }, [filteredGuns, page, pageSize])

  // ---- detail view ----
  const [selectedGun, setSelectedGun] = useState(null)

  // ---- delete / archive modal (Point 6) ----
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleSoftDelete = () => {
    if (!deleteTarget) return
    archiveService.archiveGun(deleteTarget)
    setDeleteTarget(null)
    showToast(`"${deleteTarget.name}" archived (soft-deleted). You can restore it in Profile.`)
  }

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError('')
      await gunService.deleteGun(deleteTarget.id)
      setDeleteTarget(null)
      refetch()
      showToast(`"${deleteTarget.name}" permanently deleted.`)
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  // ---- If viewing a single product detail ----
  if (selectedGun) {
    return (
      <GunDetail
        gun={selectedGun}
        onBack={() => setSelectedGun(null)}
        onEdit={(g) => onNavigate && onNavigate('Edit', g)}
        onDelete={(g) => {
          setSelectedGun(null)
          setDeleteTarget(g)
        }}
        onShareNotification={showToast}
      />
    )
  }

  // ---- Main catalog view ----
  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          A small armory of pistols, rifles, and shotguns. Every piece listed
          with its type, caliber, and price — with real-time query caching and lazy loading.
        </p>
      </section>

      {toastMsg && (
        <div className="toast toast--success">
          <Check size={18} /> {toastMsg}
        </div>
      )}

      <section>
        <div className="list-head">
          <h2>Current stock</h2>
          <div className="list-head-right">
            <span className="count">
              {filteredGuns.length} piece{filteredGuns.length !== 1 ? 's' : ''}
            </span>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={setSearch}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => {
            setSortKey(key)
            setSortOrder(order)
          }}
        />

        {/* States */}
        {loading && rawGuns.length === 0 && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && error && !useLocal && rawGuns.length === 0 && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>
              {typeof error === 'object'
                ? error?.message || JSON.stringify(error)
                : String(error)}
            </p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Retry
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                View Local Catalog
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGuns.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No products match your search or active filters.</p>
          </div>
        )}

        {/* Product grid with Lazy Loading */}
        {paginatedGuns.length > 0 && (
          <ul className="stock">
            {paginatedGuns.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                onSelect={setSelectedGun}
                onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onDelete={setDeleteTarget}
                onShareNotification={showToast}
              />
            ))}
          </ul>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Pagination Controls (Point 1) */}
        {/* ---------------------------------------------------------------- */}
        {filteredGuns.length > 0 && (
          <div className="pagination-bar">
            <div className="pagination-info">
              Showing {(page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, filteredGuns.length)} of{' '}
              {filteredGuns.length} items
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1))
                  window.scrollTo({ top: 220, behavior: 'smooth' })
                }}
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} /> Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1,
                )
                .map((p, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1
                  return (
                    <span key={p} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {showEllipsisBefore && <span style={{ padding: '0 4px', color: 'var(--steel)' }}>…</span>}
                      <button
                        type="button"
                        className={`pagination-btn ${page === p ? 'active' : ''}`}
                        onClick={() => {
                          setPage(p)
                          window.scrollTo({ top: 220, behavior: 'smooth' })
                        }}
                      >
                        {p}
                      </button>
                    </span>
                  )
                })}

              <button
                type="button"
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1))
                  window.scrollTo({ top: 220, behavior: 'smooth' })
                }}
                aria-label="Next Page"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>

            <div className="page-size-selector">
              <span>Per page:</span>
              <select
                className="page-size-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
            </div>
          </div>
        )}

        {useLocal && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setUseLocal(false)
                refetch()
              }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Soft Delete & Permanent Delete Confirmation Modal (Point 6) */}
      {/* ---------------------------------------------------------------- */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>
              Manage Hardware Record
            </h3>
            <p style={{ color: 'var(--steel)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Choose whether to <strong>Soft Delete / Archive</strong> &quot;{deleteTarget.name}&quot; (can be restored later in Profile) or <strong>Delete Permanently</strong> from the database.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn--outline"
                style={{ borderColor: '#e67e22', color: '#e67e22' }}
                onClick={handleSoftDelete}
              >
                <Archive size={16} /> Soft Delete (Archive to Profile)
              </button>

              <button
                type="button"
                className="btn btn--danger"
                disabled={deleting}
                onClick={handlePermanentDelete}
              >
                {deleting ? (
                  <><Loader size={16} className="spin" /> Deleting…</>
                ) : (
                  <><Trash2 size={16} /> Delete Permanently</>
                )}
              </button>

              <button
                type="button"
                className="btn btn--outline"
                style={{ marginTop: '8px' }}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="toast toast--error">{deleteError}</div>
      )}
    </>
  )
}
