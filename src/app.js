import { ENTRIES } from './core/data/index.js'
import { createSession, currentQuestion, answer as answerSession, advance, isFinished, summary } from './core/session.js'
import { buildQueue, weakest, newCard, grade } from './core/srs.js'
import { loadState, saveState, clearState } from './core/storage.js'
import { progressByCategory, weakCount } from './core/progress.js'
import { render } from './ui/dom.js'
import { homeView } from './ui/home.js'
import { quizView } from './ui/quizView.js'
import { resultView } from './ui/resultView.js'

export function createApp(root, { storage = globalThis.localStorage, now = () => Date.now() } = {}) {
  const saved = loadState(storage)

  const state = {
    screen: 'home',
    settings: saved.settings,
    cards: saved.cards,
    session: null,
    result: null,
  }

  const persist = () => saveState(storage, { version: 1, cards: state.cards, settings: state.settings })

  function selectedPool() {
    const wanted = new Set(state.settings.categories)
    return ENTRIES.filter((e) => wanted.has(e.category) && e.tier <= state.settings.tier)
  }

  function startSession(entries) {
    if (!entries.length) return
    state.session = createSession(entries, {
      mode: state.settings.answerMode,
      pool: ENTRIES,
      rng: Math.random,
    })
    state.result = null
    state.screen = 'quiz'
    draw()
  }

  function start() {
    startSession(buildQueue(selectedPool(), state.cards, { count: state.settings.count, now: now() }))
  }

  function review() {
    startSession(weakest(ENTRIES, state.cards, { count: state.settings.count }))
  }

  function submit(given) {
    if (state.result) return
    const { session, result } = answerSession(state.session, given)
    if (!result) return
    state.session = session
    state.result = result
    const id = result.entry.id
    state.cards[id] = grade(state.cards[id] ?? newCard(id), result.correct, now())
    persist()
    draw()
  }

  function next() {
    if (!state.result) return
    state.session = advance(state.session)
    state.result = null
    if (isFinished(state.session)) state.screen = 'result'
    draw()
  }

  function goHome() {
    state.screen = 'home'
    state.session = null
    state.result = null
    draw()
  }

  function updateSettings(patch) {
    state.settings = { ...state.settings, ...patch }
    persist()
    draw()
  }

  function reset() {
    if (!globalThis.confirm?.('学習の記録をすべて消します。よろしいですか？')) return
    state.cards = {}
    clearState(storage)
    persist()
    draw()
  }

  function draw() {
    if (state.screen === 'quiz') {
      const question = currentQuestion(state.session)
      render(
        root,
        quizView({
          question,
          result: state.result,
          index: state.session.index,
          total: state.session.questions.length,
          onAnswer: submit,
          onNext: next,
          onQuit: goHome,
        }),
      )
      return
    }

    if (state.screen === 'result') {
      const s = summary(state.session)
      render(
        root,
        resultView({
          summary: s,
          onAgain: start,
          onHome: goHome,
          onReviewMissed: () => startSession(s.missed),
        }),
      )
      return
    }

    render(
      root,
      homeView({
        settings: state.settings,
        progress: progressByCategory(ENTRIES, state.cards),
        weak: weakCount(ENTRIES, state.cards),
        onStart: start,
        onReview: review,
        onChange: updateSettings,
        onReset: reset,
      }),
    )
  }

  // 4択は数字キー、判定後はEnterで次へ。手を動かさずに回せるようにする。
  function onKey(event) {
    if (state.screen !== 'quiz') return
    if (state.result) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        next()
      }
      return
    }
    const question = currentQuestion(state.session)
    if (question?.mode !== 'choice') return
    const n = Number(event.key)
    if (Number.isInteger(n) && n >= 1 && n <= question.choices.length) {
      event.preventDefault()
      submit(question.choices[n - 1])
    }
  }

  document.addEventListener('keydown', onKey)
  draw()

  return {
    get state() {
      return state
    },
    start,
    review,
    submit,
    next,
    goHome,
    updateSettings,
    entries: ENTRIES,
    currentQuestion: () => (state.session ? currentQuestion(state.session) : null),
  }
}
