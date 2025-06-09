import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useCellValue, usePublisher } from '@mdxeditor/editor'
import { navigateToMatch$, performSearch$, searchState$, toggleSearchVisibility$ } from '.'
import { LuChevronDown, LuChevronUp, LuX } from 'react-icons/lu'

import './search.css'
import { debounce } from 'lodash'

export function SearchUI() {
  const searchState = useCellValue(searchState$)
  const performSearch = usePublisher(performSearch$)
  const navigateToMatch = usePublisher(navigateToMatch$)
  const toggleVisibility = usePublisher(toggleSearchVisibility$)
  const searchRef = useRef<HTMLInputElement>(null)

  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = debounce(
    useCallback(
      (value: string) => {
        performSearch(value)
        setSearchTerm(value)
      },
      [performSearch]
    ),
    10
  )

  const closeSearch = useCallback(() => {
    performSearch('')
    toggleVisibility(false)
  }, [performSearch, toggleVisibility])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        if (searchState.isVisible) {
          closeSearch()
        } else {
          toggleVisibility(true)
          handleSearch(searchTerm)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  })

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) {
          navigateToMatch('prev')
        } else {
          navigateToMatch('next')
        }
      } else if (e.key === 'Escape') {
        closeSearch()
      }
    },
    [navigateToMatch, closeSearch]
  )

  return searchState.isVisible ? (
    <div className="search-container transition">
      <input
        ref={searchRef}
        type="text"
        className="search-input"
        onKeyDown={handleKeyDown}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        autoFocus
      />
      {searchState.matches.length > 0 && (
        <span className="search-container-info">
          {searchState.currentMatchIndex + 1} of {searchState.matches.length}
        </span>
      )}
      <button
        className="centre note-titlebar-option transition pointer"
        onClick={() => navigateToMatch('prev')}
        disabled={searchState.matches.length === 0}
        title="Previous match (Shift+Enter)"
      >
        <LuChevronUp />
      </button>
      <button
        className="centre note-titlebar-option transition pointer"
        onClick={() => navigateToMatch('next')}
        disabled={searchState.matches.length === 0}
        title="Next match (Enter)"
      >
        <LuChevronDown />
      </button>
      <button
        className="centre note-titlebar-option transition pointer"
        onClick={() => {
          closeSearch()
        }}
      >
        <LuX />
      </button>
    </div>
  ) : (
    <> </>
  )
}
