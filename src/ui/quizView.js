import { el, glyph } from './dom.js'

function judgement(entry, result) {
  return el('div', { class: `judge judge--${result.correct ? 'ok' : 'ng'}` }, [
    el('p', { class: 'judge__verdict', text: result.correct ? '正解' : 'ちがう' }),
    !result.correct && result.given
      ? el('p', { class: 'judge__given', text: `答えた内容：${result.given}` })
      : null,
    el('p', { class: 'judge__detail', text: entry.detail }),
    entry.sub ? el('p', { class: 'judge__sub', text: entry.sub }) : null,
    entry.note ? el('p', { class: 'judge__note', text: entry.note }) : null,
    el('button', { class: 'btn btn--primary', text: 'つぎへ', onClick: () => {} , 'data-next': '' }),
  ])
}

function choiceButtons(question, result, onAnswer) {
  return el(
    'div',
    { class: 'choices' },
    question.choices.map((choice, i) => {
      const isAnswer = choice === question.entry.answer
      const picked = result && result.given === choice
      const state = !result ? '' : isAnswer ? ' choice--ok' : picked ? ' choice--ng' : ' choice--dim'
      return el('button', {
        class: `choice${state}`,
        disabled: result ? true : null,
        onClick: () => onAnswer(choice),
      }, [
        el('span', { class: 'choice__key', text: String(i + 1) }),
        el('span', { class: 'choice__text', text: choice }),
      ])
    }),
  )
}

function inputForm(question, result, onAnswer) {
  const input = el('input', {
    class: 'answerInput',
    type: 'text',
    placeholder: 'ひらがなで',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    disabled: result ? true : null,
    value: result ? result.given : '',
  })

  const form = el('form', {
    class: 'answerForm',
    onSubmit: (e) => {
      e.preventDefault()
      if (!result) onAnswer(input.value)
    },
  }, [
    input,
    el('button', { class: 'btn btn--primary', type: 'submit', disabled: result ? true : null, text: '答える' }),
  ])

  if (!result) queueMicrotask(() => input.focus())
  return form
}

export function quizView({ question, result, index, total, onAnswer, onNext, onQuit }) {
  const view = el('main', { class: 'view view--quiz' }, [
    el('div', { class: 'quizbar' }, [
      el('button', { class: 'btn btn--quiet', text: 'やめる', onClick: onQuit }),
      el('span', { class: 'quizbar__count', text: `${index + 1} / ${total}` }),
    ]),
    el('div', { class: 'progressline' }, [
      el('div', { class: 'progressline__fill', style: `width:${(index / total) * 100}%` }),
    ]),

    el('section', { class: 'card' }, [
      glyph(question.entry),
      el('p', { class: 'card__question', text: question.text }),
      question.mode === 'choice'
        ? choiceButtons(question, result, onAnswer)
        : inputForm(question, result, onAnswer),
    ]),

    result ? judgement(question.entry, result) : null,
  ])

  const next = view.querySelector('[data-next]')
  if (next) {
    next.addEventListener('click', onNext)
    queueMicrotask(() => next.focus())
  }
  return view
}
