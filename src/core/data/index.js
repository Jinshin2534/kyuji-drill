import { KYUJI } from './kyuji.js'
import { HENTAIGANA } from './hentaigana.js'
import { SYMBOLS } from './symbols.js'
import { KANAZUKAI } from './kanazukai.js'

// カテゴリ（習熟度の集計単位、ホームでの選択単位）
export const CATEGORIES = [
  { id: 'kyuji', label: '旧字体・異体字', blurb: '國→国、櫻→桜' },
  { id: 'kana', label: '変体仮名・合字', blurb: '𛀂・ゟ・〆' },
  { id: 'kanazukai', label: '歴史的仮名遣い', blurb: 'けふ→きょう' },
]

// グループ（4択の誤答を引いてくる範囲）
// 変体仮名と記号は読みの形が違いすぎるため、混ぜると答えが割れてしまう。
const toEntries = () => {
  const entries = []

  for (const k of KYUJI) {
    entries.push({
      id: `kyuji:${k.old}`,
      category: 'kyuji',
      group: 'kyuji',
      prompt: k.old,
      hentaiganaFont: false,
      answer: k.shinji,
      readings: k.readings,
      question: 'この字は今のどの字？',
      inputQuestion: 'この字の読みは？',
      detail: `${k.old} → ${k.shinji}（${k.example}）`,
      // 旧字体は detail に読みが出ないので別に添える
      sub: `読み：${k.readings.join('・')}`,
      note: k.note ?? null,
      tier: k.tier,
    })
  }

  for (const h of HENTAIGANA) {
    if (h.multi) continue // 読みが一意でない字は出題しない
    entries.push({
      id: `kana:${h.char}`,
      category: 'kana',
      group: 'hentaigana',
      prompt: h.char,
      hentaiganaFont: true,
      answer: h.reading,
      readings: [h.reading],
      question: 'この変体仮名の読みは？',
      inputQuestion: 'この変体仮名の読みは？',
      detail: `${h.reading}（字母は「${h.jibo}」）`,
      note: null,
      tier: h.tier,
    })
  }

  for (const s of SYMBOLS) {
    entries.push({
      id: `kana:${s.char}`,
      category: 'kana',
      group: 'symbol',
      prompt: s.char,
      // 𛀀𛀁 は同梱フォントでしか出ない
      hentaiganaFont: s.char.codePointAt(0) >= 0x1b000,
      answer: s.readings[0],
      readings: s.readings,
      question: 'この記号の読みは？',
      inputQuestion: 'この記号の読みは？',
      detail: s.name,
      note: s.note,
      tier: s.tier,
    })
  }

  for (const k of KANAZUKAI) {
    entries.push({
      id: `kanazukai:${k.hist}`,
      category: 'kanazukai',
      group: 'kanazukai',
      prompt: k.hist,
      hentaiganaFont: false,
      answer: k.modern,
      readings: [k.modern],
      question: '今の仮名遣いでは？',
      inputQuestion: '今の仮名遣いでは？',
      detail: `${k.hist} → ${k.modern}（${k.word}）`,
      note: k.note ?? null,
      tier: k.tier,
    })
  }

  return entries
}

export const ENTRIES = toEntries()

export const entryById = new Map(ENTRIES.map((e) => [e.id, e]))
