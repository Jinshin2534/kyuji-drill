import { CATEGORIES } from './data/index.js'

// ボックス4以上を「覚えた」とみなす（正解3回でここに届く）
export const MASTERED_BOX = 4

function summarize(entries, cards) {
  let seen = 0
  let mastered = 0
  let right = 0
  let wrong = 0

  for (const entry of entries) {
    const card = cards[entry.id]
    if (!card) continue
    seen += 1
    if (card.box >= MASTERED_BOX) mastered += 1
    right += card.right
    wrong += card.wrong
  }

  const answered = right + wrong
  return {
    total: entries.length,
    seen,
    mastered,
    accuracy: answered ? right / answered : null,
    masteredRatio: entries.length ? mastered / entries.length : 0,
  }
}

export function progressByCategory(entries, cards = {}) {
  return CATEGORIES.map((category) => ({
    ...category,
    ...summarize(entries.filter((e) => e.category === category.id), cards),
  }))
}

export function overallProgress(entries, cards = {}) {
  return summarize(entries, cards)
}

export function weakCount(entries, cards = {}) {
  return entries.filter((e) => (cards[e.id]?.wrong ?? 0) > 0).length
}
