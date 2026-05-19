import { Plugin, PluginKey } from "prosemirror-state"

const myPluginKey = new PluginKey("myPlugin")

const myPlugin = new Plugin({
    key: myPluginKey,
    // ② 行为钩子
    props: {
        handleKeyDown(view, event) {
            // 返回false 就是不拦截，返回true 就是拦截。拦截代表不执行默认行为
            return false
        },
        handleTextInput(view, from, to, text,) {
            const { state } = view
            const { tr, selection } = state
            const { $from } = selection
            console.log('phx handleTextInput $from', $from)
            if (text === '@') {
                const { state, dispatch } = view
                const { tr, selection } = state
                const nodeType = state.schema.nodes.customLink
                const node = nodeType.create()
                tr.replaceSelectionWith(node)
                dispatch(tr)
                return true
            }
            return false
        },
    },
})

export const plugins = [myPlugin]