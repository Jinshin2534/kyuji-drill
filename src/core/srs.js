import { shuffle } from './rng.js'

const DAY = 24 * 60 * 60 * 1000

export const MAX_BOX = 5

// ボックス1..5に上がった直後、次に出るまでの日数。
// ボックス1は「同じ日のうちにまた出す」。
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 21]

export function newCard(id) {
  return { id, box: 1, due: 0, right: 0, wrong: 0, lastSeen: 0 }
}

export function grade(card, correct, now = Date.now()) {
  const box = correct ? Math.min(MAX_BOX, card.box + 1) : 1
  return {
    ...card,
    box,
    right: card.right + (correct ? 1 : 0),
    wrong: card.wrong + (correct ? 0 : 1),
    due: now + BOX_INTERVAL_DAYS[box - 1] * DAY,
    lastSeen: now,
  }
}

export function isDue(card, now = Date.now()) {
  return !card || card.due <= now
}

// 出題順は「期限切れ → 未学習 → まだ期限が来ていないもの（期限が近い順）」。
// 最後の一群まで含めるのは、全部覚えたあとでも回せるようにするため。
export function buildQueue(entries, cards = {}, { count = 10, now = Date.now(), rng = Math.random } = {}) {
  const overdue = []
  const fresh = []
  const later = []

  for (const entry of entries) {
    const card = cards[entry.id]
    if (!card) fresh.push(entry)
    else if (card.due <= now) overdue.push(entry)
    else later.push(entry)
  }

  later.sort((a, b) => cards[a.id].due - cards[b.id].due)

  return [...shuffle(overdue, rng), ...shuffle(fresh, rng), ...later].slice(0, count)
}

export function weakest(entries, cards = {}, { count = 10 } = {}) {
  return entries
    .filter((e) => (cards[e.id]?.wrong ?? 0) > 0)
    .sort((a, b) => cards[b.id].wrong - cards[a.id].wrong)
    .slice(0, count)
}
