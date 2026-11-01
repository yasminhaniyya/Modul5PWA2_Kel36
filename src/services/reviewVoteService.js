// ---------------------------------------------------------------------------
// reviewVoteService.js — Tracks thumbs up / thumbs down votes per review
// ---------------------------------------------------------------------------

const VOTES_KEY = 'bore_barrel_review_votes'

class ReviewVoteService {
  getVotes() {
    try {
      const raw = localStorage.getItem(VOTES_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  saveVotes(votes) {
    try {
      localStorage.setItem(VOTES_KEY, JSON.stringify(votes))
      window.dispatchEvent(new Event('review-votes-updated'))
      return true
    } catch {
      return false
    }
  }

  getReviewVoteData(reviewId) {
    const all = this.getVotes()
    return all[reviewId] || { up: 0, down: 0, myVote: null }
  }

  vote(reviewId, type) {
    const all = this.getVotes()
    const current = all[reviewId] || { up: 0, down: 0, myVote: null }

    if (current.myVote === type) {
      // Toggle off
      if (type === 'up') current.up = Math.max(0, current.up - 1)
      if (type === 'down') current.down = Math.max(0, current.down - 1)
      current.myVote = null
    } else {
      // If switching vote
      if (current.myVote === 'up') current.up = Math.max(0, current.up - 1)
      if (current.myVote === 'down') current.down = Math.max(0, current.down - 1)

      if (type === 'up') current.up += 1
      if (type === 'down') current.down += 1
      current.myVote = type
    }

    all[reviewId] = current
    this.saveVotes(all)
    return current
  }
}

export default new ReviewVoteService()
