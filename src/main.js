import './style.css'
import { createApp } from './app.js'

const app = createApp(document.getElementById('app'))

// ヘッドレスでの動作確認用
window.__app = app
