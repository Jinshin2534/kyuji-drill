import { describe, it, expect } from 'vitest'
import { newCard, grade, isDue, buildQueue, weakest, MAX_BOX, BOX_INTERVAL_DAYS } from '../src/core/srs.js'
import { makeRng } from '../src/core/rng.js'

const DAY = 24 * 60 * 60 * 1000
const T0 = 1_700_000_000_000

const entries = [
  { id: 'a', category: 'kyuji', tier: 1 },
  { id: 'b', category: 'kyuji', tier: 1 },
  { id: 'c', category: 'kyuji', tier: 1 },
  { id: 'd', category: 'kyuji', tier: 1 },
]

describe('grade', () => {
  it('正解でボックスが1つ上がる', () => {
    const card = grade(newCard('a'), true, T0)
    expect(card.box).toBe(2)
    expect(card.right).toBe(1)
  })

  it('誤答でボックス1に戻る', () => {
    let card = newCard('a')
    for (let i = 0; i < 3; i++) card = grade(card, true, T0)
    expect(card.box).toBe(4)
    card = grade(card, false, T0)
    expect(card.box).toBe(1)
    expect(card.wrong).toBe(1)
  })

  it('最大ボックスを超えない', () => {
    let card = newCard('a')
    for (let i = 0; i < 10; i++) card = grade(card, true, T0)
    expect(card.box).toBe(MAX_BOX)
  })

  it('次に出る日がボックスに応じて延びる', () => {
    const first = grade(newCard('a'), true, T0)
    const second = grade(first, true, T0)
    expect(second.due - T0).toBeGreaterThan(first.due - T0)
    expect(first.due).toBe(T0 + BOX_INTERVAL_DAYS[1] * DAY)
  })

  it('誤答したカードはすぐまた出る', () => {
    let card = newCard('a')
    card = grade(card, true, T0)
    card = grade(card, false, T0)
    expect(isDue(card, T0)).toBe(true)
  })
})

describe('buildQueue（SRSモード）', () => {
  it('未学習のカードを出す', () => {
    const queue = buildQueue(entries, {}, { count: 4, now: T0, rng: makeRng(1) })
    expect(queue.map((e) => e.id).sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('期限が来ていないカードは後回しになる', () => {
    const cards = {
      a: grade(newCard('a'), true, T0), // 1日後まで出ない
      b: newCard('b'),
    }
    const queue = buildQueue([entries[0], entries[1]], cards, { count: 1, now: T0, rng: makeRng(1) })
    expect(queue[0].id).toBe('b')
  })

  it('期限が来たカードは戻ってくる', () => {
    const cards = { a: grade(newCard('a'), true, T0) }
    const queue = buildQueue([entries[0]], cards, { count: 1, now: T0 + 2 * DAY, rng: makeRng(1) })
    expect(queue[0].id).toBe('a')
  })

  it('要求数を超えない', () => {
    const queue = buildQueue(entries, {}, { count: 2, now: T0, rng: makeRng(1) })
    expect(queue).toHaveLength(2)
  })

  it('全部覚えていても空にはならない', () => {
    const cards = {}
    for (const e of entries) {
      let c = newCard(e.id)
      for (let i = 0; i < 5; i++) c = grade(c, true, T0)
      cards[e.id] = c
    }
    const queue = buildQueue(entries, cards, { count: 3, now: T0, rng: makeRng(1) })
    expect(queue).toHaveLength(3)
  })
})

describe('weakest（ニガテモード）', () => {
  it('間違えた回数の多い順に出す', () => {
    const cards = {
      a: { ...newCard('a'), wrong: 1 },
      b: { ...newCard('b'), wrong: 5 },
      c: { ...newCard('c'), wrong: 3 },
      d: newCard('d'),
    }
    const list = weakest(entries, cards, { count: 3 })
    expect(list.map((e) => e.id)).toEqual(['b', 'c', 'a'])
  })

  it('一度も間違えていない問題は含めない', () => {
    const cards = { a: { ...newCard('a'), wrong: 2 } }
    const list = weakest(entries, cards, { count: 10 })
    expect(list.map((e) => e.id)).toEqual(['a'])
  })
})
