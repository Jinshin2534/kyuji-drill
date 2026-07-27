import { describe, it, expect } from 'vitest'
import { ENTRIES, entryById } from '../src/core/data/index.js'
import { createSession, currentQuestion, answer, advance, isFinished, summary } from '../src/core/session.js'
import { loadState, saveState, clearState, defaultState, STORAGE_KEY, DEFAULT_SETTINGS } from '../src/core/storage.js'
import { progressByCategory, overallProgress, weakCount } from '../src/core/progress.js'
import { newCard, grade } from '../src/core/srs.js'
import { makeRng } from '../src/core/rng.js'

const three = ['kyuji:國', 'kyuji:學', 'kanazukai:けふ'].map((id) => entryById.get(id))

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  }
}

describe('session', () => {
  it('渡した数だけ問題を作る', () => {
    const s = createSession(three, { mode: 'choice', pool: ENTRIES, rng: makeRng(3) })
    expect(s.questions).toHaveLength(3)
    expect(isFinished(s)).toBe(false)
  })

  it('4択で正解を選べば正解になる', () => {
    let s = createSession(three, { mode: 'choice', pool: ENTRIES, rng: makeRng(3) })
    const q = currentQuestion(s)
    const { result } = answer(s, q.entry.answer)
    expect(result.correct).toBe(true)
  })

  it('4択で別の選択肢を選べば不正解になる', () => {
    const s = createSession(three, { mode: 'choice', pool: ENTRIES, rng: makeRng(3) })
    const q = currentQuestion(s)
    const other = q.choices.find((c) => c !== q.entry.answer)
    expect(answer(s, other).result.correct).toBe(false)
  })

  it('入力モードは読みで判定する', () => {
    const s = createSession([entryById.get('kanazukai:けふ')], { mode: 'input', pool: ENTRIES, rng: makeRng(3) })
    expect(answer(s, 'きょう').result.correct).toBe(true)
    expect(answer(s, 'けふ').result.correct).toBe(false)
  })

  it('最後まで進むと終わる', () => {
    let s = createSession(three, { mode: 'choice', pool: ENTRIES, rng: makeRng(3) })
    for (let i = 0; i < 3; i++) {
      s = answer(s, currentQuestion(s).entry.answer).session
      s = advance(s)
    }
    expect(isFinished(s)).toBe(true)
    expect(summary(s)).toMatchObject({ total: 3, right: 3, wrong: 0 })
  })

  it('間違えた問題を結果に残す', () => {
    let s = createSession(three, { mode: 'choice', pool: ENTRIES, rng: makeRng(3) })
    s = answer(s, 'まちがい').session
    s = advance(s)
    s = answer(s, currentQuestion(s).entry.answer).session
    expect(summary(s).missed).toHaveLength(1)
    expect(summary(s).missed[0].id).toBe('kyuji:國')
  })

  it('元のセッションを書き換えない', () => {
    const s = createSession(three, { mode: 'choice', pool: ENTRIES, rng: makeRng(3) })
    answer(s, 'なんでも')
    expect(s.results).toHaveLength(0)
  })
})

describe('storage', () => {
  it('保存したものを読み戻せる', () => {
    const store = memoryStorage()
    const state = defaultState()
    state.cards.a = newCard('a')
    saveState(store, state)
    expect(loadState(store).cards.a).toEqual(newCard('a'))
  })

  it('保存がなければ初期状態', () => {
    expect(loadState(memoryStorage())).toEqual(defaultState())
  })

  it('壊れたJSONでも初期状態に戻る', () => {
    expect(loadState(memoryStorage({ [STORAGE_KEY]: '{{{' }))).toEqual(defaultState())
  })

  it('バージョンが違えば初期状態に戻る', () => {
    const store = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 99, cards: { a: 1 } }) })
    expect(loadState(store).cards).toEqual({})
  })

  it('欠けた設定は既定値で埋める', () => {
    const store = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, cards: {}, settings: { tier: 2 } }) })
    expect(loadState(store).settings).toEqual({ ...DEFAULT_SETTINGS, tier: 2 })
  })

  it('消せる', () => {
    const store = memoryStorage()
    saveState(store, defaultState())
    clearState(store)
    expect(loadState(store)).toEqual(defaultState())
  })
})

describe('progress', () => {
  it('カテゴリごとに集計する', () => {
    const rows = progressByCategory(ENTRIES, {})
    expect(rows.map((r) => r.id)).toEqual(['kyuji', 'kana', 'kanazukai'])
    for (const r of rows) {
      expect(r.total).toBeGreaterThan(0)
      expect(r.seen).toBe(0)
      expect(r.accuracy).toBeNull()
    }
  })

  it('正解3回で「覚えた」に入る', () => {
    let card = newCard('kyuji:國')
    for (let i = 0; i < 3; i++) card = grade(card, true, 0)
    const rows = progressByCategory(ENTRIES, { 'kyuji:國': card })
    const kyuji = rows.find((r) => r.id === 'kyuji')
    expect(kyuji.seen).toBe(1)
    expect(kyuji.mastered).toBe(1)
  })

  it('正答率を出す', () => {
    const cards = {
      'kyuji:國': { ...newCard('kyuji:國'), right: 3, wrong: 1 },
    }
    expect(overallProgress(ENTRIES, cards).accuracy).toBeCloseTo(0.75)
  })

  it('ニガテの数を数える', () => {
    const cards = {
      'kyuji:國': { ...newCard('kyuji:國'), wrong: 2 },
      'kyuji:學': { ...newCard('kyuji:學'), wrong: 0 },
    }
    expect(weakCount(ENTRIES, cards)).toBe(1)
  })
})
