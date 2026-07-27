export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue
    if (key === 'class') node.className = value
    else if (key === 'text') node.textContent = value
    else if (key === 'html') node.innerHTML = value
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value)
    else if (key === 'dataset') Object.assign(node.dataset, value)
    else node.setAttribute(key, value === true ? '' : value)
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue
    node.append(typeof child === 'string' ? document.createTextNode(child) : child)
  }
  return node
}

export function clear(node) {
  node.replaceChildren()
  return node
}

export function render(root, ...nodes) {
  clear(root).append(...nodes.filter(Boolean))
  return root
}

// 変体仮名は同梱フォントでしか字形が出ないのでクラスを分ける
export function glyph(entry, extraClass = '') {
  return el('div', {
    class: ['glyph', entry.hentaiganaFont && 'glyph--hentaigana', extraClass].filter(Boolean).join(' '),
    text: entry.prompt,
  })
}
