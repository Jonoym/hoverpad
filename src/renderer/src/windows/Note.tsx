import { useEffect, useMemo, useRef, useState } from 'react'
import { LuX, LuPenLine, LuLoaderCircle, LuCircle } from 'react-icons/lu'

import { Divider, Editor, Frame } from '@renderer/components'
import { handleClose } from '@renderer/functions'

import './Note.css'
import { debounce } from 'lodash'

export interface WindowInfo {
  windowType: string
  data: Record<string, string>
}

interface NoteProps {
  windowInfo: WindowInfo
}

function Note({ windowInfo }: NoteProps) {
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [isEditable, setIsEditable] = useState<boolean>(windowInfo.data.editable == 'true')
  const [isTitleEditable, setTitleEditable] = useState<boolean>(false)
  const [isSaved, setIsSaved] = useState<boolean>(true)
  const [saveMessage, setSaveMessage] = useState('')

  const titleRef = useRef<string>(windowInfo.data.title)
  const previousTitleRef = useRef<string>(windowInfo.data.title)
  const contentRef = useRef<string>(windowInfo.data.content)

  useEffect(() => {
    window.api.onToggleEdit((editable): void => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
      setIsEditable(editable)
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveContent()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.api.onToggleEdit(() => {})
    }
  }, [])

  const handleTitleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>): Promise<void> => {
    setIsSaved(false)
    if (e.key === 'Enter') {
      setTitleEditable(false)
      const target = e.currentTarget as HTMLInputElement
      if (target) target.blur()
    }
  }

  const saveContent = async () => {
    if (!titleRef.current || titleRef.current === '') {
      setIsSaved(true)
      setSaveMessage('Title Required')
      console.error('Unable to save empty Title')
      return
    }

    window.api
      .saveContent(titleRef.current, previousTitleRef.current, contentRef.current)
      .then((response) => {
        setIsSaved(true)
        if (response.success) {
          previousTitleRef.current = titleRef.current
          setSaveMessage('Saved')
        } else {
          setSaveMessage(response.error!)
        }
      })
  }

  const setContent = (content: string) => (contentRef.current = content)

  const debouncedSave = useMemo(() => debounce(saveContent, 1000), [])
  const debouncedSet = useMemo(() => debounce(setContent, 1000), [])

  const saveSucceeded = () => {
    return saveMessage === 'Saved'
  }

  return (
    <Frame>
      <div className="note-container no-drag">
        <div
          className={`note-titlebar drag transition ${isEditable ? '' : 'note-titlebar-inactive'}`}
        >
          <div className="note-titlebar-title">
            <input
              ref={titleInputRef}
              type="text"
              defaultValue={titleRef.current}
              readOnly={!isTitleEditable}
              className={`transition ${isTitleEditable ? '' : 'input-inactive'} ${saveSucceeded() ? '' : 'title-error'}`}
              onKeyDown={handleTitleKeyDown}
              onBlur={(e) => {
                titleRef.current = e.target.value
                setTitleEditable(false)
                debouncedSave()
              }}
            />
          </div>
          <div className="note-control-buttons">
            <button
              className="centre note-titlebar-option transition pointer"
              onClick={() => {
                setTitleEditable(true)
                titleInputRef.current?.focus()
              }}
            >
              <LuPenLine className="note-titlebar-icon transition" />
            </button>
            <Divider />
            <button
              disabled={isSaved}
              className={`centre note-titlebar-option transition pointer save-button`}
            >
              {isSaved ? (
                <div className="tooltip-container">
                  <LuCircle
                    className={`note-titlebar-icon transition ${isSaved ? 'saved' : ''} ${saveSucceeded() ? '' : 'error'}`}
                  />
                  <span
                    className={`tooltip-text ${saveSucceeded() ? 'tooltip-text-success' : 'tooltip-text-error'}`}
                  >
                    {saveMessage}
                  </span>
                </div>
              ) : (
                <div className="tooltip-container">
                  <LuLoaderCircle
                    className={`note-titlebar-icon transition ${isSaved ? '' : 'loading'}`}
                  />
                  <span className="tooltip-text tooltip-text-neutral">Saving</span>
                </div>
              )}
            </button>
            <Divider />
            <button
              className="centre note-titlebar-option transition pointer"
              onClick={handleClose}
            >
              <LuX className="note-titlebar-icon transition" />
            </button>
          </div>
        </div>
        <div className="note-content">
          <Editor
            content={windowInfo.data.content}
            setContent={(content) => {
              debouncedSet(content)
              debouncedSave()
            }}
            setEditing={() => setIsSaved(false)}
          />
        </div>
        <div className="note-footer" />
      </div>
    </Frame>
  )
}

export default Note
