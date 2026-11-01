import { useState, useEffect } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Play,
  UserCheck,
  RotateCcw,
  Trash2,
  ExternalLink,
  Archive,
  Info,
  PhoneCall,
  MapPin,
  Mail,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { getAllDraftIds, loadDraft, deleteDraft, formatDraftTime } from '../utils/draftStorage'
import archiveService from '../services/archiveService'

export default function ProfilePage({ onReplaySplash, onEditProfile, onOpenDraft }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')

  const { favorites } = useFavorites()
  const [drafts, setDrafts] = useState([])
  const [archivedGuns, setArchivedGuns] = useState(() => archiveService.getArchivedGuns())

  const loadDraftList = () => {
    const ids = getAllDraftIds()
    const list = ids
      .map((id) => {
        const d = loadDraft(id)
        return d ? { id, ...d } : null
      })
      .filter(Boolean)
    setDrafts(list)
  }

  const syncArchive = () => {
    setArchivedGuns(archiveService.getArchivedGuns())
  }

  useEffect(() => {
    setProfile(userService.getUserProfile())
    loadDraftList()
    syncArchive()

    window.addEventListener('archive-updated', syncArchive)
    return () => window.removeEventListener('archive-updated', syncArchive)
  }, [])

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDeleteDraftItem = (draftId) => {
    deleteDraft(draftId)
    loadDraftList()
    setFeedback('Draft successfully removed.')
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleRestoreGun = (gunId) => {
    archiveService.restoreGun(gunId)
    syncArchive()
    setFeedback('Product restored to catalog.')
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleDeletePermanently = async (gunId) => {
    if (window.confirm('Delete this product permanently? This cannot be undone.')) {
      await archiveService.deletePermanently(gunId)
      syncArchive()
      setFeedback('Product permanently deleted.')
      setTimeout(() => setFeedback(''), 3000)
    }
  }

  return (
    <div className="profile-page">
      <section
        className="masthead"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="display">Operator Profile &amp; Control</h1>
          <p className="lede">
            Credentials, catalog drafts, archived stock, and armory communications.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onEditProfile && (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={onEditProfile}
            >
              <UserCheck size={15} /> Edit Profile
            </button>
          )}
          {onReplaySplash && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onReplaySplash}
              title="Replay introductory splash animation"
            >
              <Play size={14} /> Replay Intro
            </button>
          )}
        </div>
      </section>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
          </div>

          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID to clipboard"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
            {profile.bio && (
              <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--steel)' }}>
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Saved Drafts</div>
          </div>
          <div className="stat-item">
            <Archive size={20} className="stat-icon" stroke="#e67e22" />
            <div className="stat-val">{archivedGuns.length}</div>
            <div className="stat-label">Archived Items</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION: Catalog Drafts */}
      {/* ------------------------------------------------------------------ */}
      <section className="profile-section" style={{ marginTop: '36px' }}>
        <div className="list-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--brass)" />
            <h2 style={{ margin: 0 }}>Saved Catalog Drafts ({drafts.length})</h2>
          </div>
        </div>

        {drafts.length === 0 ? (
          <div className="state-box" style={{ padding: '24px' }}>
            <p style={{ margin: 0 }}>No unpublished drafts currently saved in storage.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
            {drafts.map((d) => {
              const name = d.formData?.name || 'Untitled Draft'
              const caliber = d.formData?.caliber || 'Standard'
              const type = d.formData?.type || 'Pistol'
              const price = d.formData?.price || 0
              const timeAgo = formatDraftTime(d.savedAt)

              return (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: '#fff',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ink)' }}>
                      {name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--steel)' }}>
                      {type} · {caliber} · ${price} — Saved {timeAgo}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {onOpenDraft && (
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() => onOpenDraft(d.id)}
                      >
                        <ExternalLink size={14} /> Resume Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => handleDeleteDraftItem(d.id)}
                      title="Discard draft"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION: Soft Deleted / Archived Hardware */}
      {/* ------------------------------------------------------------------ */}
      <section className="profile-section" style={{ marginTop: '36px' }}>
        <div className="list-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Archive size={20} color="#e67e22" />
            <h2 style={{ margin: 0 }}>Archived Catalog / Soft-Deleted ({archivedGuns.length})</h2>
          </div>
        </div>

        {archivedGuns.length === 0 ? (
          <div className="state-box" style={{ padding: '24px' }}>
            <p style={{ margin: 0 }}>No archived or soft-deleted items. Catalog is fully active.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
            {archivedGuns.map((gun) => (
              <div
                key={gun.id || gun.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: '#fff',
                  border: '1px solid #f39c12',
                  borderRadius: '6px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ink)' }}>
                    {gun.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--steel)' }}>
                    {gun.type || 'Hardware'} · Caliber: {gun.caliber || 'Standard'} · ${gun.price || 0}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => handleRestoreGun(gun.id || gun.name)}
                    title="Restore item to active catalog"
                  >
                    <RotateCcw size={14} /> Restore
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => handleDeletePermanently(gun.id || gun.name)}
                    title="Delete permanently from database"
                  >
                    <Trash2 size={14} /> Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION: About (Moved to Profile per Point 5) */}
      {/* ------------------------------------------------------------------ */}
      <section className="profile-section" style={{ marginTop: '36px' }}>
        <div className="list-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={20} color="var(--brass)" />
            <h2 style={{ margin: 0 }}>About Bore &amp; Barrel</h2>
          </div>
        </div>
        <div style={{ background: '#fff', padding: '20px', border: '1px solid var(--line)', borderRadius: '6px', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 12px' }}>
            <strong>Bore &amp; Barrel</strong> is a digital armory catalog and procurement specification registry. Built with offline-first Progressive Web App capabilities, it provides operators with immediate access to firearm profiles, field-stripping procedures, and community field reviews.
          </p>
          <p style={{ margin: 0, color: 'var(--steel)', fontSize: '0.9rem' }}>
            Every entry follows rigorous specification standards: type, caliber, operating action, and verified price sheets.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION: Contact (Moved to Profile per Point 5) */}
      {/* ------------------------------------------------------------------ */}
      <section className="profile-section" style={{ marginTop: '36px', marginBottom: '24px' }}>
        <div className="list-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall size={20} color="var(--brass)" />
            <h2 style={{ margin: 0 }}>Armory Contact &amp; Support</h2>
          </div>
        </div>
        <div style={{ background: '#fff', padding: '20px', border: '1px solid var(--line)', borderRadius: '6px', display: 'grid', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin size={18} color="var(--brass)" />
            <span>Sector 4 Armory Depot, Building B, Industrial Complex</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={18} color="var(--brass)" />
            <span>procurement@boreandbarrel.armory</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PhoneCall size={18} color="var(--brass)" />
            <span>Secure Tactical Radio: Channel 142.85 MHz / WhatsApp Desk</span>
          </div>
        </div>
      </section>
    </div>
  )
}
