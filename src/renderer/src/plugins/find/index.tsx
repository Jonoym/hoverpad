import {
  realmPlugin,
  Cell,
  Signal,
  rootEditor$,
  addComposerChild$,
  createRootEditorSubscription$,
  Realm
} from '@mdxeditor/editor'
import {
  $nodesOfType,
  TextNode,
  $createRangeSelection,
  $setSelection,
  $getSelection,
  type LexicalEditor,
  $createTextNode,
  TextFormatType,
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
  terminating: boolean
  isVisible: boolean
}

// State management cells
export const searchState$ = Cell<SearchState>({
  searchTerm: '',
  matches: [],
  currentMatchIndex: -1,
  terminating: false,
  isVisible: false
})

const SEARCH_HIGHLIGHT_FORMAT: TextFormatType = 'highlight'

// Helper function to split text node with highlighting
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        newNode.setFormat(textNode.getFormat())
        newNode.toggleFormat(SEARCH_HIGHLIGHT_FORMAT)
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
          newNode.setFormat(node.getFormat())
          node.toggleFormat(SEARCH_HIGHLIGHT_FORMAT)
          node.replace(newNode)
        }
      })
    },
    {
      discrete: true,
      tag: 'search-clear-highlights' // Tag for search operations
    }
  )
}

// Signals for actions
export const performSearch$ = Signal<string>((r) => {
  r.sub(performSearch$, (searchTerm) => {
    const editor = r.getValue(rootEditor$)

    if (!editor) return

    // clearSearchHighlights(editor)

    if (!searchTerm.trim()) {
      r.pub(searchState$, {
        searchTerm: '',
        matches: [],
        currentMatchIndex: -1,
        terminating: false,
        isVisible: true
      })
      return
    }

    const matches: SearchMatch[] = []

    // Use discrete read to prevent interference with ongoing edits
    editor.update(
      () => {
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
          // for (const [nodeKey, matchesInNode] of nodeMatches) {
          //   const node = editor.getEditorState().read(() => {
          //     return textNodes.find((n) => n.getKey() === nodeKey)
          //   })

          //   if (node && node.isAttached()) {
          //     const highlightData = matchesInNode.map((match) => ({
          //       startOffset: match.startOffset,
          //       endOffset: match.endOffset,
          //       isCurrent: match.matchIndex === 0 // First match is current
          //     }))

          //     splitAndHighlightTextNode(node, highlightData)
          //   }
          // }
        } catch (error) {
          console.debug('Search error:', error)
        }
      },
      {
        discrete: true,
        tag: 'search-apply-highlights' // Tag for search operations
      }
    )

    const state = {
      searchTerm,
      matches,
      currentMatchIndex: matches.length > 0 ? 0 : -1,
      terminating: false,
      isVisible: true
    }

    r.pub(searchState$, state)
  })
})

const navigate = (r: Realm, state: SearchState, editor: LexicalEditor, direction: string) => {
  if (state.matches.length === 0) return

  let newIndex = state.currentMatchIndex

  if (direction === 'next') {
    newIndex = (state.currentMatchIndex + 1) % state.matches.length
  } else if (direction === 'prev') {
    newIndex = state.currentMatchIndex <= 0 ? state.matches.length - 1 : state.currentMatchIndex - 1
  } else {
    newIndex = state.currentMatchIndex
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
        tag: 'search-navigation' // Tag for search operations
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
}

export const navigateToMatch$ = Signal<'next' | 'prev'>((r) => {
  r.sub(navigateToMatch$, (direction) => {
    const state = r.getValue(searchState$)
    const editor = r.getValue(rootEditor$)

    if (!editor) return

    navigate(r, state, editor, direction)
  })
})

export const toggleSearchVisibility$ = Signal<boolean>((r) => {
  r.sub(toggleSearchVisibility$, (isVisible) => {
    const state = r.getValue(searchState$)
    r.pub(searchState$, {
      ...state,
      terminating: false,
      isVisible
    })
  })
})

// Plugin definition
export const textSearchPlugin = realmPlugin({
  init(r) {
    // Add the search UI to the editor
    r.pubIn({
      [addComposerChild$]: () => <SearchUI />
    })

    r.pub(createRootEditorSubscription$, (editor: LexicalEditor) => {
      return editor.registerUpdateListener(({ tags }) => {
        // Only close search if this is NOT a search-related update
        const isSearchUpdate =
          tags.has('search-apply-highlights') ||
          tags.has('search-clear-highlights') ||
          tags.has('search-navigation')

        if (!isSearchUpdate) {
          const state = r.getValue(searchState$)
          if (state.isVisible) {
            // Clear highlights and close search
            clearSearchHighlights(editor)
            r.pub(searchState$, {
              searchTerm: '',
              matches: [],
              currentMatchIndex: -1,
              terminating: true,
              isVisible: true
            })
          }
        }
      })
    })

    // Handle search state changes with debouncing
    let searchTimeout: NodeJS.Timeout
    r.sub(searchState$, (state) => {
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
