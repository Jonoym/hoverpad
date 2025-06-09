import {
  realmPlugin,
  Cell,
  Signal,
  rootEditor$,
  createRootEditorSubscription$,
  addComposerChild$
} from '@mdxeditor/editor'
import {
  $nodesOfType,
  TextNode,
  $createRangeSelection,
  $setSelection,
  $getSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  type LexicalEditor,
  $createTextNode,
  TextFormatType
} from 'lexical'
import { SearchUI } from './Search'

// Types
interface SearchMatch {
  node: TextNode
  startOffset: number
  endOffset: number
  text: string
}

interface SearchState {
  searchTerm: string
  matches: SearchMatch[]
  currentMatchIndex: number
  isVisible: boolean
}

// State management cells
export const searchState$ = Cell<SearchState>({
  searchTerm: '',
  matches: [],
  currentMatchIndex: -1,
  isVisible: false
})

const SEARCH_HIGHLIGHT_FORMAT: TextFormatType = 'highlight'

// Helper function to split text node with highlighting
function splitAndHighlightTextNode(
  textNode: TextNode,
  matches: Array<{ startOffset: number; endOffset: number; isCurrent: boolean }>
): void {
  if (!textNode.isAttached()) return

  const text = textNode.getTextContent()
  if (!text || matches.length === 0) return

  // Sort matches by start offset
  const sortedMatches = matches.sort((a, b) => a.startOffset - b.startOffset)

  // Create segments: [non-match, match, non-match, match, ...]
  const segments: Array<{
    text: string
    isHighlight: boolean
    isCurrent: boolean
  }> = []

  let currentPos = 0

  for (const match of sortedMatches) {
    // Add text before match
    if (currentPos < match.startOffset) {
      segments.push({
        text: text.slice(currentPos, match.startOffset),
        isHighlight: false,
        isCurrent: false
      })
    }

    // Add highlighted match
    segments.push({
      text: text.slice(match.startOffset, match.endOffset),
      isHighlight: true,
      isCurrent: match.isCurrent
    })

    currentPos = match.endOffset
  }

  // Add remaining text
  if (currentPos < text.length) {
    segments.push({
      text: text.slice(currentPos),
      isHighlight: false,
      isCurrent: false
    })
  }

  // Replace the original node with the segmented nodes
  const parent = textNode.getParent()
  if (!parent) return

  // Insert new nodes
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i]
    if (segment.text) {
      const newNode = $createTextNode(segment.text)

      if (segment.isHighlight) {
        newNode.setFormat(SEARCH_HIGHLIGHT_FORMAT)
      }

      textNode.insertAfter(newNode)
    }
  }

  // Remove the original node
  textNode.remove()
}

// Helper function to clear all search highlights
function clearSearchHighlights(editor: LexicalEditor): void {
  editor.update(
    () => {
      const textNodes = $nodesOfType(TextNode)

      textNodes.forEach((node) => {
        if (node.hasFormat(SEARCH_HIGHLIGHT_FORMAT)) {
          // Remove formatting but keep the text
          const text = node.getTextContent()
          const newNode = $createTextNode(text)
          node.replace(newNode)
        }
      })
    },
    { discrete: true }
  )
}

// Signals for actions
export const performSearch$ = Signal<string>((r) => {
  r.sub(performSearch$, (searchTerm) => {
    const editor = r.getValue(rootEditor$)

    if (!editor) return

    clearSearchHighlights(editor)

    if (!searchTerm.trim()) {
      r.pub(searchState$, {
        searchTerm: '',
        matches: [],
        currentMatchIndex: -1,
        isVisible: true
      })
      return
    }

    const matches: SearchMatch[] = []

    // Use discrete read to prevent interference with ongoing edits
    editor.update(() => {
      try {
        const textNodes = $nodesOfType(TextNode)
        const nodeMatches = new Map<
          string,
          Array<{ startOffset: number; endOffset: number; matchIndex: number }>
        >()

        textNodes.forEach((node) => {
          // Check if node is still attached to the editor
          if (!node.isAttached()) return

          const text = node.getTextContent()
          if (!text) return

          const searchTermLower = searchTerm.toLowerCase()
          const textLower = text.toLowerCase()
          const nodeKey = node.getKey()

          let startIndex = 0
          let matchIndex = textLower.indexOf(searchTermLower, startIndex)

          while (matchIndex !== -1) {
            matches.push({
              node,
              startOffset: matchIndex,
              endOffset: matchIndex + searchTerm.length,
              text: text.substring(matchIndex, matchIndex + searchTerm.length)
            })

            if (!nodeMatches.has(nodeKey)) {
              nodeMatches.set(nodeKey, [])
            }

            nodeMatches.get(nodeKey)?.push({
              startOffset: matchIndex,
              endOffset: matchIndex + searchTerm.length,
              matchIndex: matches.length - 1
            })

            startIndex = matchIndex + 1
            matchIndex = textLower.indexOf(searchTermLower, startIndex)
          }
        })

        // Second pass: apply highlighting
        for (const [nodeKey, matchesInNode] of nodeMatches) {
          const node = editor.getEditorState().read(() => {
            return textNodes.find((n) => n.getKey() === nodeKey)
          })

          if (node && node.isAttached()) {
            const highlightData = matchesInNode.map((match) => ({
              startOffset: match.startOffset,
              endOffset: match.endOffset,
              isCurrent: match.matchIndex === 0 // First match is current
            }))

            splitAndHighlightTextNode(node, highlightData)
          }
        }
      } catch (error) {
        console.debug('Search error:', error)
      }
    })

    r.pub(searchState$, {
      searchTerm,
      matches,
      currentMatchIndex: matches.length > 0 ? 0 : -1,
      isVisible: true
    })
  })
})

export const navigateToMatch$ = Signal<'next' | 'prev'>((r) => {
  r.sub(navigateToMatch$, (direction) => {
    const state = r.getValue(searchState$)
    const editor = r.getValue(rootEditor$)

    if (!editor || state.matches.length === 0) return

    let newIndex = state.currentMatchIndex

    if (direction === 'next') {
      newIndex = (state.currentMatchIndex + 1) % state.matches.length
    } else {
      newIndex =
        state.currentMatchIndex <= 0 ? state.matches.length - 1 : state.currentMatchIndex - 1
    }

    // Scroll to and select the match
    const match = state.matches[newIndex]
    if (match) {
      editor.update(
        () => {
          // Check if the node still exists and is valid
          const node = match.node
          if (!node || !node.isAttached()) {
            return
          }

          const selection = $createRangeSelection()

          // Ensure offsets are within bounds
          const textContent = node.getTextContent()
          const safeStartOffset = Math.min(match.startOffset, textContent.length)
          const safeEndOffset = Math.min(match.endOffset, textContent.length)

          selection.anchor.set(node.getKey(), safeStartOffset, 'text')
          selection.focus.set(node.getKey(), safeEndOffset, 'text')
          $setSelection(selection)
        },
        {
          discrete: true, // Prevent this update from being merged with user input
          tag: 'search-navigation'
        }
      )

      // Scroll the match into view with better error handling
      setTimeout(() => {
        try {
          const selection = editor.getEditorState().read(() => $getSelection())
          if (selection && selection.isCollapsed() === false) {
            const domSelection = window.getSelection()
            if (domSelection && domSelection.rangeCount > 0) {
              const range = domSelection.getRangeAt(0)
              const rect = range.getBoundingClientRect()
              if (rect.top < 0 || rect.bottom > window.innerHeight) {
                const element =
                  range.commonAncestorContainer.nodeType === Node.TEXT_NODE
                    ? range.commonAncestorContainer.parentElement
                    : (range.commonAncestorContainer as Element)

                element?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                })
              }
            }
          }
        } catch (error) {
          console.debug('Search scroll error:', error)
        }
      }, 50)
    }

    r.pub(searchState$, {
      ...state,
      currentMatchIndex: newIndex
    })
  })
})

export const toggleSearchVisibility$ = Signal<boolean>((r) => {
  r.sub(toggleSearchVisibility$, (isVisible) => {
    const state = r.getValue(searchState$)
    r.pub(searchState$, {
      ...state,
      isVisible
    })
  })
})

// CSS injection for highlighting
const injectSearchCSS = () => {
  const existingStyle = document.getElementById('mdx-search-highlight-style')
  if (existingStyle) return

  const style = document.createElement('style')
  style.id = 'mdx-search-highlight-style'
  style.innerHTML = `
    .text-search {
      background-color:rgba(59, 111, 255, 0.57) !important;
      color: #000 !important;
      padding: 1px 2px !important;
      border-radius: 2px !important;
    }
    
    .text-search.current-match {
      background-color:rgba(48, 104, 156, 0.51) !important;
      animation: pulse 1s ease-in-out;
    }
    
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.8; }
    }
  `
  document.head.appendChild(style)
}

// Plugin definition
export const textSearchPlugin = realmPlugin({
  init(realm) {
    // Inject CSS for highlighting
    injectSearchCSS()

    // Add the search UI to the editor
    realm.pubIn({
      [addComposerChild$]: () => <SearchUI />
    })

    // Register keyboard shortcut (Ctrl+F / Cmd+F)
    realm.pub(createRootEditorSubscription$, (editor: LexicalEditor) => {
      return editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event: KeyboardEvent) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
            event.preventDefault()
            event.stopPropagation()

            // Use discrete update to prevent interference with text input
            editor.update(
              () => {
                // Don't modify selection or content, just trigger UI
                realm.pub(toggleSearchVisibility$, true)
              },
              {
                discrete: true,
                tag: 'search-toggle'
              }
            )

            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    })

    // Handle search state changes with debouncing
    let searchTimeout: NodeJS.Timeout
    realm.sub(searchState$, (state) => {
      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }

      // Debounce to prevent rapid updates during typing
      searchTimeout = setTimeout(() => {
        if (!state.searchTerm || state.matches.length === 0) {
          // Remove all highlights
          document.querySelectorAll('.text-search').forEach((el) => {
            el.classList.remove('text-search', 'current-match')
          })
          return
        }

        // For proper highlighting, we would need to implement a Lexical decorator
        // This is a placeholder for the highlighting logic
      }, 100)
    })

    // Cleanup on unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }
})
