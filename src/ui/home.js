import { el } from './dom.js'
import { CATEGORIES } from '../core/data/index.js'

const TIERS = [
  { value: 1, label: 'よく見る字だけ', blurb: 'まず出会うものに絞る' },
  { value: 2, label: '全部', blurb: '変体仮名285字まで含む' },
]

const MODES = [
  { value: 'choice', label: '4択' },
  { value: 'input', label: '読みを入力' },
  { value: 'mix', label: '混在' },
]

const COUNTS = [10, 20, 30]

function bar(row) {
  return el('div', { class: 'bar' }, [
    el('div', {
      class: 'bar__fill',
      style: `width:${Math.round(row.masteredRatio * 100)}%`,
    }),
  ])
}

function progressRow(row) {
  return el('li', { class: 'progress__row' }, [
    el('div', { class: 'progress__head' }, [
      el('span', { class: 'progress__label', text: row.label }),
      el('span', { class: 'progress__count', text: `${row.mastered} / ${row.total}` }),
    ]),
    bar(row),
  ])
}

function fieldset(legend, controls) {
  return el('fieldset', { class: 'field' }, [el('legend', { text: legend }), ...controls])
}

function toggle({ checked, label, blurb, onChange, name, type = 'checkbox' }) {
  const input = el('input', { type, name, checked: checked || null, onChange })
  return el('label', { class: `chip${checked ? ' chip--on' : ''}` }, [
    input,
    el('span', { class: 'chip__label', text: label }),
    blurb ? el('span', { class: 'chip__blurb', text: blurb }) : null,
  ])
}

export function homeView({ settings, progress, weak, onStart, onReview, onChange, onReset }) {
  const canStart = settings.categories.length > 0

  return el('main', { class: 'view view--home' }, [
    el('header', { class: 'masthead' }, [
      el('h1', { class: 'masthead__title', text: '旧字ドリル' }),
      el('p', {
        class: 'masthead__lead',
        text: '明治から戦前の本でつまずく文字を、クイズで潰す。',
      }),
    ]),

    fieldset(
      '出題範囲',
      [
        el(
          'div',
          { class: 'chips' },
          CATEGORIES.map((c) =>
            toggle({
              label: c.label,
              blurb: c.blurb,
              checked: settings.categories.includes(c.id),
              onChange: () => {
                const next = settings.categories.includes(c.id)
                  ? settings.categories.filter((x) => x !== c.id)
                  : [...settings.categories, c.id]
                onChange({ categories: next })
              },
            }),
          ),
        ),
      ],
    ),

    fieldset('むずかしさ', [
      el(
        'div',
        { class: 'chips' },
        TIERS.map((t) =>
          toggle({
            type: 'radio',
            name: 'tier',
            label: t.label,
            blurb: t.blurb,
            checked: settings.tier === t.value,
            onChange: () => onChange({ tier: t.value }),
          }),
        ),
      ),
    ]),

    fieldset('答え方', [
      el(
        'div',
        { class: 'chips' },
        MODES.map((m) =>
          toggle({
            type: 'radio',
            name: 'mode',
            label: m.label,
            checked: settings.answerMode === m.value,
            onChange: () => onChange({ answerMode: m.value }),
          }),
        ),
      ),
    ]),

    fieldset('問題数', [
      el(
        'div',
        { class: 'chips' },
        COUNTS.map((n) =>
          toggle({
            type: 'radio',
            name: 'count',
            label: `${n}問`,
            checked: settings.count === n,
            onChange: () => onChange({ count: n }),
          }),
        ),
      ),
    ]),

    el('div', { class: 'actions' }, [
      el('button', {
        class: 'btn btn--primary',
        text: 'はじめる',
        disabled: !canStart || null,
        onClick: onStart,
      }),
      el('button', {
        class: 'btn',
        text: weak > 0 ? `ニガテを復習（${weak}）` : 'ニガテを復習',
        disabled: weak === 0 || null,
        onClick: onReview,
      }),
    ]),
    !canStart ? el('p', { class: 'hint hint--warn', text: '出題範囲を1つ以上選んでください。' }) : null,

    el('section', { class: 'progress' }, [
      el('h2', { class: 'progress__title', text: '覚えた字' }),
      el('ul', { class: 'progress__list' }, progress.map(progressRow)),
      el('button', { class: 'btn btn--quiet', text: '記録を消す', onClick: onReset }),
    ]),

    el('footer', { class: 'colophon' }, [
      el('p', {
        text: '変体仮名の字形は Noto Serif Hentaigana（SIL Open Font License 1.1）。字母は Unicode の注記に拠る。',
      }),
    ]),
  ])
}
