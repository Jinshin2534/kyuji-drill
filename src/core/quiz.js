import { shuffle } from './rng.js'

const CHOICE_COUNT = 4

// 入力のゆらぎ（カタカナ・半角・空白）を吸収する。
// 長音符「ー」は意味を持つので残す。
export function normalizeKana(input) {
  return String(input ?? '')
    .normalize('NFKC')
    .replace(/[\s　]/g, '')
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

export function isCorrectInput(entry, input) {
  const answer = normalizeKana(input)
  if (!answer) return false
  return entry.readings.some((r) => normalizeKana(r) === answer)
}

// 誤答は同じグループから引く。旧字体の誤答は旧字体、変体仮名の誤答は変体仮名。
// そうしないと選択肢の見た目で正解が割れてしまう。
export function makeChoices(entry, pool, rng = Math.random, count = CHOICE_COUNT) {
  const candidates = [
    ...new Set(
      pool
        .filter((e) => e.group === entry.group && e.answer !== entry.answer)
        .map((e) => e.answer),
    ),
  ]
  const distractors = shuffle(candidates, rng).slice(0, count - 1)
  return shuffle([entry.answer, ...distractors], rng)
}

export function buildQuestion(entry, { mode = 'choice', pool = [], rng = Math.random } = {}) {
  const resolved = mode === 'mix' ? (rng() < 0.5 ? 'choice' : 'input') : mode
  return {
    entry,
    mode: resolved,
    text: resolved === 'input' ? entry.inputQuestion : entry.question,
    choices: resolved === 'choice' ? makeChoices(entry, pool, rng) : null,
  }
}

export function pickStudyEntries(
  pool,
  { categories = [], tier = 2, count = 10, rng = Math.random } = {},
) {
  const wanted = new Set(categories)
  const available = pool.filter((e) => wanted.has(e.category) && e.tier <= tier)
  return shuffle(available, rng).slice(0, count)
}
