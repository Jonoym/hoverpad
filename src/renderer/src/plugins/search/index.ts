import {
  Cell,
  addActivePlugin$,
  realmPlugin,
  markdown$,
  Signal,
  map,
  activeEditor$
} from '@mdxeditor/editor'
import { TextNode } from 'lexical'
import { RefObject } from 'react'

const searchTerm$ = Cell<Readonly<RefObject<string> | null>>(null)
const highlightColor$ = Cell<string>('red')

const entry$ = Signal<string>((r) => {
  const transform = r.transformer(
    map((str: string) => {
      if (str.includes('Hello')) {
        return 'Hello World'
      }
      return str
    })
  )
  const transformMarkdown$ = transform(markdown$)
  r.link(entry$, transformMarkdown$)
})

type HighlightPluginOptions = {
  searchTerm: RefObject<string>
  highlightColor: string
}

export const highlightPlugin = realmPlugin<HighlightPluginOptions>({
  init(realm): void {
    realm.pubIn({
      [addActivePlugin$]: 'text-highlight'
    })
  },
  postInit(realm) {
    const currentEditor = realm.getValue(activeEditor$)
    if (!currentEditor) {
      return
    }
    
    // Register listener for textNodes
    currentEditor.registerNodeTransform(TextNode, (textNode) => {
      // This transform runs twice but does nothing the first time because it doesn't meet the preconditions
      const searchTerm = realm.getValue(searchTerm$)

      if (searchTerm === null || searchTerm.current === '') return

      const currentText = textNode.getTextContent()
      const includes = currentText.includes(searchTerm.current)
      if (!includes) {
        if (textNode.getStyle().includes(`color: ${realm.getValue(highlightColor$)}`)) {
          // If the TextNode doesn't include any of the strings to highlight but it is middle, remove the highlight.
        }
        return
      }

      if (includes) {
        const isAlreadyHighlighted = textNode
          .getStyle()
          .includes(`color: ${realm.getValue(highlightColor$)}`)

        const highlightString = searchTerm.current
        // Check if the current highlightString is included in the textNode's text

        if (currentText === highlightString && isAlreadyHighlighted) {
          // If the textNode's text is the same as the highlightString and it is already middle, return early to prevent infinite looping
          return
        }

        if (!currentText.includes(highlightString)) {
          return
        }

        const regex = new RegExp(highlightString, 'gi')
        let match

        while ((match = regex.exec(textNode.getTextContent())) !== null) {
          const start = match.index
          const end = start + highlightString.length
          const [before, middle, after] = textNode.splitText(start, end)

          if (!before && !middle && !after) {
            // No nodes exist, we should exit.
            break
          }

          if (before && !middle && !after) {
            // If there is no middle or after node, this means this is the first node.
            before.setStyle(`color: ${realm.getValue(highlightColor$)}`)
            textNode = before
            break
          } else if (before && middle && !after) {
            // This means the middle node is typically the correct target.
            const middleText = middle.getTextContent()
            if (middleText === highlightString) {
              //Check to see if middleText matches the regex, if it does we highlight!
              middle.setStyle(`color: ${realm.getValue(highlightColor$)}`)
            } else {
              //If it doesn't match the regex, we don't highlight.
            }
            textNode = middle
            break
          } else {
            // This means all 3 exist. Middle should still be the target due to the split
            const middleText = middle.getTextContent()
            if (middleText === highlightString) {
              //Check to see if middleText matches the regex, if it does we highlight!
              middle.setStyle(`color: ${realm.getValue(highlightColor$)}`)
            } else {
              //If it doesn't match the regex, we don't highlight.
            }
            textNode = after
            break
          }
        }
      }
    })
  },
  update(realm, options): void {
    realm.pub(searchTerm$, options?.searchTerm ?? null)
    realm.pub(highlightColor$, options?.highlightColor ?? 'red')
  }
})
