import { buildQuestion, isCorrectInput } from './quiz.js'

// 1回分の出題。状態は書き換えず、常に新しいセッションを返す。
export function createSession(entries, { mode = 'choice', pool = [], rng = Math.random } = {}) {
  return {
    questions: entries.map((entry) => buildQuestion(entry, { mode, pool, rng })),
    index: 0,
    results: [],
  }
}

export function currentQuestion(session) {
  return session.questions[session.index] ?? null
}

export function isFinished(session) {
  return session.index >= session.questions.length
}

export function answer(session, given) {
  const question = currentQuestion(session)
  if (!question) return { session, result: null }

  const correct =
    question.mode === 'input'
      ? isCorrectInput(question.entry, given)
      : given === question.entry.answer

  const result = { entry: question.entry, mode: question.mode, given, correct }
  return { session: { ...session, results: [...session.results, result] }, result }
}

export function advance(session) {
  return { ...session, index: session.index + 1 }
}

export function summary(session) {
  const right = session.results.filter((r) => r.correct).length
  return {
    total: session.results.length,
    right,
    wrong: session.results.length - right,
    missed: session.results.filter((r) => !r.correct).map((r) => r.entry),
  }
}
