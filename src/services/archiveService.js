// ---------------------------------------------------------------------------
// archiveService.js — Soft delete / Archive management with restore capability
// ---------------------------------------------------------------------------
import gunService from './gunService'
import queryCache from '../utils/queryCache'

const ARCHIVE_KEY = 'bore_barrel_archived_guns'

class ArchiveService {
  getArchivedGuns() {
    try {
      const raw = localStorage.getItem(ARCHIVE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  saveArchivedGuns(list) {
    try {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list))
      window.dispatchEvent(new Event('archive-updated'))
      return true
    } catch {
      return false
    }
  }

  isArchived(gunId) {
    const list = this.getArchivedGuns()
    return list.some((item) => String(item.id) === String(gunId))
  }

  archiveGun(gun) {
    const list = this.getArchivedGuns()
    const gunId = String(gun.id || gun.name)
    if (!list.some((item) => String(item.id || item.name) === gunId)) {
      list.push({
        ...gun,
        archivedAt: new Date().toISOString(),
      })
      this.saveArchivedGuns(list)
    }
    queryCache.invalidate('guns_')
    return list
  }

  restoreGun(gunId) {
    const list = this.getArchivedGuns().filter(
      (item) => String(item.id || item.name) !== String(gunId),
    )
    this.saveArchivedGuns(list)
    queryCache.invalidate('guns_')
    return list
  }

  async deletePermanently(gunId) {
    // Remove from archive list
    this.restoreGun(gunId)
    // Perform real database deletion
    if (gunId && !String(gunId).startsWith('local-')) {
      await gunService.deleteGun(gunId)
    }
    queryCache.invalidate('guns_')
  }
}

export default new ArchiveService()
