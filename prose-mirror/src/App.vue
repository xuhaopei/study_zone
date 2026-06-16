<template>
  <div class="doc" ref="doc">
    <p>This is <strong>strong text with <em>emphasis</em></strong></p>
    <mark>123</mark>
    <div class="callout">hhhh</div>
    <span style="color: red">123</span>
    <span class="test1" style="color: yellow">123</span>
  </div>
  <div class="editor" ref="editor"></div>
  <div @click="addLink" @mousedown.prevent>添加link</div>
  <div class="toolbar">
    <!-- 阻止 mousedown 默认行为：避免点击控件时抢走编辑器焦点导致选区丢失 -->
    <input type="color" v-model="currentColor" @mousedown.prevent />
    <button @click="setColor">setColor</button>
    <button @mousedown.prevent @click="setUnderLink">setUnderLink</button>
    <button @mousedown.prevent @click="setHeading1">setHeading1</button>
    <button @mousedown.prevent @click="setP">setP</button>
    <button @mousedown.prevent @click="delChart">delChart</button>
    <button @mousedown.prevent @click="addEmptyInlineNode">addEmptyInlineNode</button>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
// 描述编辑器整体状态，包括文档数据、选择等。
import { EditorState } from "prosemirror-state"
// UI组件，用于将编辑器状态展现为可编辑的元素，处理用户交互。
import { EditorView } from "prosemirror-view"
// 定义编辑器的文档模型，用来描述编辑器内容的数据结构。
import { DOMParser, type NodeSpec, type MarkSpec, type DOMOutputSpec } from "prosemirror-model"
// 基本schema，包含doc、paragraph、text、horizontal_rule等节点
// 可以用来创建各种节点
import { schema, nodes as basicNodes, marks as basicMarks } from "prosemirror-schema-basic"
// 历史记录，撤销使用
import { undo, redo, history } from "prosemirror-history"
// 快捷键键盘使用，通过设置快捷键来映射命令 如：keymap({ "Mod-z": undo, "Mod-y": redo }
import { keymap } from "prosemirror-keymap"
// 基本快捷键，如：回车使用
import { baseKeymap } from "prosemirror-commands"

import { Schema } from "prosemirror-model"

import { plugins } from './plugins'
import { buildInputRules } from './rule'
const editor = ref<HTMLDivElement | null>(null)
const doc = ref<HTMLDivElement | null>(null)
let editorView: EditorView
onMounted(() => {
  if (!editor.value || !doc.value) return
  const customLinkNode: NodeSpec = {
      content: "text*",
      group: "inline",
      inline: true,
      atom: true, 
      attrs: {
        abc: { default: "123" },
      },
      toDOM(node): DOMOutputSpec {
        // 两种写法：
        // 1.数组写法
        // return [
        //   "a", 
        //   { class: node.attrs.abc, style: "color: red"}, 
        //   [ 
        //     "span", 
        //     {class: 'ccc'}, 
        //     'asdasdas'
        //   ]
        // ] 
        // 2.对象写法
        const aLink = document.createElement('a')
        aLink.setAttribute('class', node.attrs.abc)
        aLink.setAttribute('style', 'color: red')
        const span1 = document.createElement('span')
        span1.setAttribute('style', 'color: red')
        span1.textContent = '【customLinkNode】'
        aLink.appendChild(span1)
        return {
          dom: aLink,
        }
      },
      parseDOM: [{
        tag: "a",
        getAttrs: (dom: string | HTMLElement) => {
          // PM 的 getAttrs 入参类型为 string | HTMLElement，这里做类型守卫
          if (typeof dom === "string") return { className: "link", label: "xixi" }
          const text = dom.textContent || ""
          return {
            className: dom.getAttribute("class") || "link",
            // 反解析时移除前缀 “艾特”
            label: text.replace(/^艾特/, "") || "xixi"
          }
        }
      }],
  }
  const inlineEmptyNode: NodeSpec = {
      content: "text*",
      group: "inline",
      inline: true,
      atom: true, 
      attrs: {},
      toDOM(node): DOMOutputSpec {
        const spanNode = document.createElement('span')
        return {
          dom: spanNode,
        }
      },
      parseDOM: [{
        tag: "span.empty",
        getAttrs: (dom: string | HTMLElement) => {
          return null
        }
      }],
  }
  // 字体颜色 mark：把选中文本包成 <span style="color:xxx">
  const colorMark: MarkSpec = {
    attrs: {
      color: { default: "#ff0000" }
    },
    parseDOM: [
      {
        // 解析带有 color 内联样式的 <span>
        tag: "span.test1",
        getAttrs: (dom: string | HTMLElement) => {
          console.log('phx colorMark parseDOM', dom)
          if (typeof dom === "string") return false
          const color = dom.style.color
          // 没有 color 样式则不命中此规则，返回 false
          return color ? { color } : false
        }
      },
    ],
    toDOM(mark): DOMOutputSpec {
      console.log('phx')
      return ["span", { style: `color: ${mark.attrs.color}` }, 0]
    }
  }

  const underLinkMark: MarkSpec = {
    toDOM(): DOMOutputSpec {
      return ["u", {}, 0]
    }
  }
  const schemaCustom = new Schema({
      nodes: {
        ...basicNodes,
        customLink: customLinkNode,
        inlineEmpty: inlineEmptyNode,
      },
      marks: {
        ...basicMarks,
        color: colorMark,
        underLink: underLinkMark
      },
  })
  const pluginsCustom = [
      // history(),
      // keymap({ "Mod-z": undo, "Mod-y": redo }),
      keymap(baseKeymap),
      ...plugins,
  ]
  // 架构中得state
  const state = EditorState.create({
    // 文档结构定义， 
    schema: schemaCustom,
    // 插件，用于扩展编辑器功能，如历史记录、快捷键等。
    plugins: pluginsCustom,
    doc: DOMParser.fromSchema(schemaCustom).parse(doc.value),
  })

  // 架构中的view
  const view = new EditorView(editor.value, {
    state,
  })
  editorView = view
})

const addLink = () => {
  if (!editorView) return
  const { state, dispatch } = editorView
  const { tr, selection } = state
  const linkType = state.schema.nodes.customLink
  const node = linkType.create()
  tr.replaceSelectionWith(node)
  dispatch(tr)
  editorView.focus()
}

// 当前选择的颜色（与 <input type="color"> 双向绑定）
const currentColor = ref("#ff0000")

const setColor = () => {
  const { state, dispatch } = editorView
  const { tr, selection } = state
  const { from, to, empty} = selection
  const markType = state.schema.marks.color;
  const colors = ['yellow', 'red', 'blue']
  const randomColor = colors[Math.floor(Math.random() * 3)]
  const colorMark =  markType.create({ color: randomColor })
  if (empty) {
    // 无选区（光标状态）：先清掉旧的 color mark，再加新颜色
    // 需要先把已有的同类型 color mark 从 storedMarks 中移除，避免叠加
    const existing = state.storedMarks ?? state.selection.$from.marks()
    const filtered = existing.filter(m => m.type !== markType)
    tr.setStoredMarks([...filtered, colorMark])
  } else {
    // 有选区：先清掉旧的 color mark，再加新颜色
    tr.removeMark(from, to, markType).addMark(from, to, colorMark)
  }
  
  dispatch(tr)
}
const setUnderLink = () => {
  const { state, dispatch } = editorView
  const { tr, selection } = state
  const { from, to, empty} = selection
  const markType = state.schema.marks.underLink
  const mark =  markType.create()
  if (empty) {
    const existing = state.storedMarks ?? state.selection.$from.marks()
    const filtered = existing.filter(m => m.type !== markType)
    tr.setStoredMarks([...filtered, mark])
  } else {
    tr.removeMark(from, to, markType).addMark(from, to, mark)
  }
  
  dispatch(tr)
}
const setHeading1 = () => {
  
  const { state, dispatch } = editorView
  const { from, to } = state.selection
  console.log('phx', from, to)
  const headingType = state.schema.nodes.heading
  const tr = state.tr.setBlockType(from, to, headingType, { level: 1 })
  dispatch(tr)

}
const setP = () => {
  
  const { state, dispatch } = editorView
  const { from, to } = state.selection
  const headingType = state.schema.nodes.paragraph
  const tr = state.tr.setBlockType(from, to, headingType, { })
  dispatch(tr)

}

const delChart = () => {
  const { state, dispatch } = editorView
  const { $from } = state.selection
}

const addEmptyInlineNode = () => {
  const { state, dispatch } = editorView
  const { tr, selection } = state
  const { from, to, empty, $from, $to } = selection
  if (empty) {
    const inlineEmptyNodeType = state.schema.nodes.inlineEmpty
    
    const markType = state.schema.marks.color
    const colorMark =  markType.create({ color: 'yellow' })
    const node = inlineEmptyNodeType.create()
    const existing = state.storedMarks ?? state.selection.$from.marks()
    const filtered = existing.filter(m => m.type !== markType)
    tr.setStoredMarks([...filtered, colorMark])
    tr.replaceSelectionWith(node)
    dispatch(tr)
  }
}
</script>
<style scoped>
.editor {
  border: 1px solid black;
}
</style>
