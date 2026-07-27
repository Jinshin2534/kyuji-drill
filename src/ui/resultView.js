import { el, glyph } from './dom.js'

function missedRow(entry) {
  return el('li', { class: 'missed__row' }, [
    glyph(entry, 'glyph--small'),
    el('div', { class: 'missed__body' }, [
      el('p', { class: 'missed__detail', text: entry.detail }),
      entry.sub ? el('p', { class: 'missed__note', text: entry.sub }) : null,
      entry.note ? el('p', { class: 'missed__note', text: entry.note }) : null,
    ]),
  ])
}

function verdict(right, total) {
  if (total === 0) return '—'
  const ratio = right / total
  if (ratio === 1) return '全問正解'
  if (ratio >= 0.8) return 'いい調子'
  if (ratio >= 0.5) return 'あと少し'
  return 'ここが伸びしろ'
}

export function resultView({ summary, onAgain, onHome, onReviewMissed }) {
  return el('main', { class: 'view view--result' }, [
    el('section', { class: 'score' }, [
      el('p', { class: 'score__verdict', text: verdict(summary.right, summary.total) }),
      el('p', { class: 'score__figure' }, [
        el('span', { class: 'score__right', text: String(summary.right) }),
        el('span', { class: 'score__total', text: ` / ${summary.total}` }),
      ]),
    ]),

    summary.missed.length
      ? el('section', { class: 'missed' }, [
          el('h2', { class: 'missed__title', text: `間違えた ${summary.missed.length} 問` }),
          el('ul', { class: 'missed__list' }, summary.missed.map(missedRow)),
        ])
      : el('p', { class: 'hint', text: '取りこぼしなし。' }),

    el('div', { class: 'actions' }, [
      el('button', { class: 'btn btn--primary', text: 'もう一度', onClick: onAgain }),
      summary.missed.length
        ? el('button', { class: 'btn', text: '間違えた分だけ', onClick: onReviewMissed })
        : null,
      el('button', { class: 'btn btn--quiet', text: 'ホームへ', onClick: onHome }),
    ]),
  ])
}
