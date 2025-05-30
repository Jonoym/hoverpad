import { useEffect, useRef, useState } from 'react'
import { LuSave, LuX, LuPenLine } from 'react-icons/lu'

import { Divider, Editor, Frame } from '@renderer/components'
import { handleClose } from '@renderer/functions'

import './Note.css'

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
    return () => {
      window.api.onToggleEdit(() => {})
    }
  }, [])

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      setTitleEditable(false)
      const target = e.currentTarget as HTMLInputElement
      if (target) target.blur()
    }
  }

  const saveContent = () => {
    console.log(`Attempting to save content for Title: ${titleRef.current}`)

    if (!titleRef.current || titleRef.current === '') {
      console.error('Unable to save empty Title')
      return
    }

    window.api.saveContent(titleRef.current, previousTitleRef.current, contentRef.current)

    previousTitleRef.current = titleRef.current
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
              className={`transition ${isTitleEditable ? '' : 'input-inactive'}`}
              onKeyDown={handleTitleKeyDown}
              onBlur={(e) => {
                titleRef.current = e.target.value
                setTitleEditable(false)
                saveContent()
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
              className="centre note-titlebar-option transition pointer"
              onClick={saveContent}
            >
              <LuSave className="note-titlebar-icon transition" />
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
            setContent={(content) => (contentRef.current = content)}
          />
        </div>
        <div className="note-footer" />
      </div>
    </Frame>
  )
}

export default Note
