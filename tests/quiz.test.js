import { describe, it, expect } from 'vitest'
import { ENTRIES, entryById } from '../src/core/data/index.js'
import { normalizeKana, isCorrectInput, makeChoices, buildQuestion, pickStudyEntries } from '../src/core/quiz.js'
import { makeRng } from '../src/core/rng.js'

const rng = () => makeRng(42)

describe('normalizeKana', () => {
  it('カタカナをひらがなに揃える', () => {
    expect(normalizeKana('キョウ')).toBe('きょう')
  })

  it('前後の空白と中の空白を落とす', () => {
    expect(normalizeKana('  き ょ う  ')).toBe('きょう')
  })

  it('半角カタカナも揃える', () => {
    expect(normalizeKana('ｷｮｳ')).toBe('きょう')
  })

  it('長音符はそのまま残す', () => {
    expect(normalizeKana('コーヒー')).toBe('こーひー')
  })
})

describe('isCorrectInput', () => {
  const kyou = entryById.get('kanazukai:けふ')

  it('正解の読みを受け付ける', () => {
    expect(isCorrectInput(kyou, 'きょう')).toBe(true)
  })

  it('カタカナ入力も受け付ける', () => {
    expect(isCorrectInput(kyou, 'キョウ')).toBe(true)
  })

  it('別の読みは通さない', () => {
    expect(isCorrectInput(kyou, 'けふ')).toBe(false)
  })

  it('空入力は通さない', () => {
    expect(isCorrectInput(kyou, '   ')).toBe(false)
  })

  it('複数ある読みはどれでも正解', () => {
    const kuni = entryById.get('kyuji:國')
    expect(isCorrectInput(kuni, 'こく')).toBe(true)
    expect(isCorrectInput(kuni, 'くに')).toBe(true)
  })
})

describe('makeChoices', () => {
  it('4つ返し、正解をちょうど1つ含む', () => {
    const entry = entryById.get('kyuji:國')
    const choices = makeChoices(entry, ENTRIES, rng())
    expect(choices).toHaveLength(4)
    expect(choices.filter((c) => c === entry.answer)).toHaveLength(1)
  })

  it('選択肢が重複しない', () => {
    for (const entry of ENTRIES.slice(0, 60)) {
      const choices = makeChoices(entry, ENTRIES, rng())
      expect(new Set(choices).size).toBe(choices.length)
    }
  })

  it('誤答は同じグループから引く', () => {
    const entry = entryById.get('kana:ゟ')
    const choices = makeChoices(entry, ENTRIES, rng())
    const symbolAnswers = new Set(
      ENTRIES.filter((e) => e.group === 'symbol').flatMap((e) => e.readings),
    )
    for (const c of choices) expect(symbolAnswers.has(c)).toBe(true)
  })

  it('変体仮名の誤答に正解と同じ読みが混ざらない', () => {
    // 「あ」の変体仮名は複数あるので、読みで重複しやすい
    const entry = ENTRIES.find((e) => e.group === 'hentaigana' && e.answer === 'あ')
    const choices = makeChoices(entry, ENTRIES, rng())
    expect(choices.filter((c) => c === 'あ')).toHaveLength(1)
  })
})

describe('buildQuestion', () => {
  it('choiceモードでは選択肢が付く', () => {
    const q = buildQuestion(entryById.get('kyuji:國'), { mode: 'choice', pool: ENTRIES, rng: rng() })
    expect(q.mode).toBe('choice')
    expect(q.choices).toHaveLength(4)
  })

  it('inputモードでは選択肢を作らない', () => {
    const q = buildQuestion(entryById.get('kyuji:國'), { mode: 'input', pool: ENTRIES, rng: rng() })
    expect(q.mode).toBe('input')
    expect(q.choices).toBeNull()
  })

  it('mixモードはどちらかに決まる', () => {
    const q = buildQuestion(entryById.get('kyuji:國'), { mode: 'mix', pool: ENTRIES, rng: rng() })
    expect(['choice', 'input']).toContain(q.mode)
  })
})

describe('pickStudyEntries', () => {
  it('選んだカテゴリだけ出す', () => {
    const picked = pickStudyEntries(ENTRIES, { categories: ['kanazukai'], tier: 2, count: 10, rng: rng() })
    expect(picked).toHaveLength(10)
    for (const e of picked) expect(e.category).toBe('kanazukai')
  })

  it('tier1を選ぶとtier2は出ない', () => {
    const picked = pickStudyEntries(ENTRIES, { categories: ['kyuji'], tier: 1, count: 20, rng: rng() })
    for (const e of picked) expect(e.tier).toBe(1)
  })

  it('同じ問題を二度出さない', () => {
    const picked = pickStudyEntries(ENTRIES, { categories: ['kana'], tier: 2, count: 30, rng: rng() })
    expect(new Set(picked.map((e) => e.id)).size).toBe(picked.length)
  })

  it('在庫より多く要求されても在庫分だけ返す', () => {
    const picked = pickStudyEntries(ENTRIES, { categories: ['kanazukai'], tier: 1, count: 9999, rng: rng() })
    const stock = ENTRIES.filter((e) => e.category === 'kanazukai' && e.tier === 1)
    expect(picked).toHaveLength(stock.length)
  })
})

describe('データの健全性', () => {
  it('idが重複しない', () => {
    expect(new Set(ENTRIES.map((e) => e.id)).size).toBe(ENTRIES.length)
  })

  it('読みが一意でない変体仮名は出題対象に入らない', () => {
    const multiReading = ENTRIES.filter((e) => e.group === 'hentaigana' && e.answer.length > 1)
    expect(multiReading).toHaveLength(0)
  })

  it('すべてのエントリに答えと読みがある', () => {
    for (const e of ENTRIES) {
      expect(e.answer, e.id).toBeTruthy()
      expect(e.readings.length, e.id).toBeGreaterThan(0)
    }
  })

  it('各グループに4択を作れるだけの在庫がある', () => {
    const counts = {}
    for (const e of ENTRIES) counts[e.group] = (counts[e.group] ?? 0) + 1
    for (const [group, n] of Object.entries(counts)) {
      expect(n, group).toBeGreaterThanOrEqual(4)
    }
  })
})
