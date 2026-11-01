import { useState } from 'react'
import { ArrowLeft, Save, Camera, Check, Shield } from 'lucide-react'
import userService from '../services/userService'

export default function EditProfilePage({ onBack, onSaved }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [phone, setPhone] = useState(() => localStorage.getItem('wa_checkout_phone') || '6281234567890')
  const [feedback, setFeedback] = useState('')

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Avatar image must be under 2MB.')
      setTimeout(() => setFeedback(''), 3000)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      userService.updateAvatar(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e) => {
    e.preventDefault()
    const updated = {
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      avatar,
    }
    const result = userService.saveUserProfile(updated)
    localStorage.setItem('wa_checkout_phone', phone.trim())

    if (result.success) {
      setFeedback('Profile successfully updated.')
      if (onSaved) onSaved(result.data)
      setTimeout(() => {
        onBack()
      }, 800)
    } else {
      setFeedback('Failed to save profile.')
    }
  }

  return (
    <div className="profile-page">
      <div style={{ marginBottom: '20px' }}>
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Profile
        </button>
      </div>

      <section className="masthead">
        <h1 className="display">Edit Operator Profile</h1>
        <p className="lede">
          Update your callsign, armorer notes, avatar, and contact preferences.
        </p>
      </section>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      <form onSubmit={handleSave} className="profile-form" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div className="avatar-wrap">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
            <label htmlFor="edit-avatar-input" className="avatar-upload-btn" title="Upload avatar">
              <Camera size={14} />
              <input
                id="edit-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ink)' }}>Avatar Photo</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--steel)' }}>Click the camera icon to upload a picture</div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="edit-name" className="form-label">
            Callsign / Operator Alias
          </label>
          <input
            id="edit-name"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Operator Delta, Master Gunsmith"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-phone" className="form-label">
            WhatsApp Number (for Cart Checkout)
          </label>
          <input
            id="edit-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 6281234567890"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-bio" className="form-label">
            Armory Notes / Station Bio
          </label>
          <textarea
            id="edit-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Qualifications, preferred calibers, unit assignment..."
            rows={4}
            className="form-textarea"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn btn--primary">
            <Save size={16} /> Save Changes
          </button>
          <button type="button" className="btn btn--outline" onClick={onBack}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
