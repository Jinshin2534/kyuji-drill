export const STORAGE_KEY = 'kyuji-drill/v1'
export const STATE_VERSION = 1

export const DEFAULT_SETTINGS = {
  categories: ['kyuji', 'kana', 'kanazukai'],
  tier: 1, // 1=よく見る字だけ / 2=全部
  answerMode: 'choice', // choice | input | mix
  count: 10,
}

export function defaultState() {
  return { version: STATE_VERSION, cards: {}, settings: { ...DEFAULT_SETTINGS } }
}

// 壊れた保存データでアプリが起動しなくなるのを避ける。読めなければ初期状態に戻す。
export function loadState(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    if (parsed?.version !== STATE_VERSION) return defaultState()
    return {
      version: STATE_VERSION,
      cards: parsed.cards ?? {},
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    }
  } catch {
    return defaultState()
  }
}

export function saveState(storage, state) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearState(storage) {
  try {
    storage?.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
