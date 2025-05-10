import { useEffect, useRef, useState } from 'react'
import { LuSave, LuX, LuPenLine } from 'react-icons/lu'

import { Divider, Editor, Frame } from '@renderer/components'
import { handleClose } from '@renderer/functions'

import './Note.css'

interface NoteProps {
  editable: boolean
}

function Note({ editable }: NoteProps) {
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [isEditable, setIsEditable] = useState<boolean>(editable)
  const [isTitleEditable, setTitleEditable] = useState<boolean>(false)
  // const [content, setContent] = useState<string>('## Hello MDX')

  const titleRef = useRef<string>(null)

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
              // value="New nOte"
              readOnly={!isTitleEditable}
              className={`transition ${isTitleEditable ? '' : 'input-inactive'}`}
              // onChange={(e) => (titleRef.current = e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={(e) => {
                titleRef.current = e.target.value
                setTitleEditable(false)
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
            <button className="centre note-titlebar-option transition pointer">
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
          <Editor />
        </div>
        <div className="note-footer" />
      </div>
    </Frame>
  )
}

export default Note
