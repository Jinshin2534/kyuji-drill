# 旧字ドリル

明治から戦前の本を読むときにつまずく「今は使われない文字」を、クイズで潰すためのWebアプリ。

出題は3つ。

- **旧字体・異体字** — 國→国、櫻→桜、辨/辯/瓣→弁
- **変体仮名・合字** — 𛀂（安）、𛂦（者）、ゟ、〆、ヿ、くの字点
- **歴史的仮名遣い** — けふ→きょう、くわし→かし、ゐ・ゑ・を

答え方は4択と読み入力。間隔反復（Leitnerボックス）で復習が回り、
間違えた問題だけを狙うニガテモードがある。記録はブラウザのlocalStorageに残る。

## 動かす

```bash
pnpm install
pnpm dev      # http://localhost:5320
pnpm test     # Vitest
pnpm build
```

## 構成

```
src/core/    純粋関数。DOMに触れない（quiz / srs / session / progress / storage / rng）
src/core/data/  出題データ
src/ui/      描画
src/app.js   配線。window.__app でヘッドレスから叩ける
tools/       変体仮名データの生成スクリプト
```

## 変体仮名について

変体仮名（U+1B002–U+1B11E）は標準フォントに字形がないため、
[Noto Serif Hentaigana](https://fonts.google.com/specimen/Noto+Serif+Hentaigana)（SIL Open Font License 1.1）を
その範囲だけサブセットして `public/fonts/` に同梱している。ライセンス文は同じ場所の `OFL.txt`。

各字の字母（元になった漢字）は Unicode の `NamesList.txt` に付いている
`* derived from` 注記から機械生成している。記憶で書き起こすと誤りが混ざるため。

```bash
curl -O https://www.unicode.org/Public/UCD/latest/ucd/NamesList.txt
python3 tools/gen-hentaigana.py NamesList.txt > src/core/data/hentaigana.js
```

## 問題を足す

`src/core/data/` の表に1行足すだけでよい。問題文と誤答の選択肢は出題時に組み立てられる。
`hentaigana.js` だけは自動生成なので直接編集しない。

## 設計

[docs/superpowers/specs/2026-07-27-kyuji-drill-design.md](docs/superpowers/specs/2026-07-27-kyuji-drill-design.md)
