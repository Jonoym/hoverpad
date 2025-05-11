import { useEffect } from 'react'
import Frame from '../components/Frame'
import './ControlPanel.css'
import {
  LuPencil,
  LuPencilOff,
  LuEye,
  LuSunMoon,
  LuClipboardPlus,
  LuSettings,
  LuFileStack,
  LuChevronUp,
  LuX
} from 'react-icons/lu'
import { useState } from 'react'
import Divider from '../components/Divider'
import { handleClose } from '@renderer/functions'
import { Catalogue } from '@renderer/components'
import { NoteInfo } from '@shared/types'

function ControlPanel() {
  const [opacity, setOpacity] = useState(100)
  const [isEditable, setIsEditable] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [notes, setNotes] = useState<Array<NoteInfo>>([])

  useEffect(() => {
    window.api.onToggleEdit((editable: boolean): void => {
      setIsEditable(editable)
    })

    window.api.onNotesList((notes: Array<NoteInfo>) => {
      setNotes(notes)
    })

    return () => {
      window.api.onToggleEdit(() => {})
    }
  }, [])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = Number(e.target.value)
    setOpacity(value)
    window.api.changeOpacity(value / 100)
  }

  const createNote = (): void => {
    window.api.createNote()
  }

  const toggleEdit = (): void => {
    window.api.toggleEdit()
  }

  const toggleHide = (): void => {
    window.api.toggleHide()
  }

  const toggleExpand = (): void => {
    if (isExpanded) {
      setTimeout(() => window.api.toggleExpand(), 300)
    } else {
      window.api.toggleExpand()
    }
    const expanded = isExpanded
    setIsExpanded(!expanded)
  }

  return (
    <Frame className={`${isExpanded ? 'control-frame-expanded' : 'control-frame-closed'}`}>
      <div className="control-panel-window">
        <div className={`control-panel spaced`}>
          <div className="control-panel-container centre">
            <button
              className={`centre control-panel-option no-drag transition pointer ${isEditable ? 'control-panel-option-active' : 'control-panel-option-inactive'}`}
              onClick={toggleEdit}
            >
              {isEditable ? (
                <LuPencil className="control-panel-icon transition" />
              ) : (
                <LuPencilOff className="control-panel-icon transition" />
              )}
              <span className="centre container key transition">
                <LuChevronUp className="control-panel-icon transition" />
              </span>
              <span>+</span>
              <span className="centre container key transition">E</span>
            </button>
            <Divider vertical />
            <button
              className="centre control-panel-option no-drag transition pointer"
              onClick={toggleHide}
            >
              <LuEye className="control-panel-icon transition" />
              <span className="centre container key transition">
                {' '}
                <LuChevronUp className="control-panel-icon transition" />
              </span>
              <span>+</span>
              <span className="centre container key transition">H</span>
            </button>
            <Divider vertical />
            <div className="centre control-panel-option no-drag transition">
              <LuSunMoon className="control-panel-icon transition" />
              <div className="slider-container centre">
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={opacity}
                  onChange={handleSliderChange}
                  className="slider transition"
                  style={{ '--slider-value': '50%' } as React.CSSProperties}
                />
              </div>
            </div>
            <Divider vertical />
            <button
              className="centre control-panel-option no-drag transition pointer"
              onClick={createNote}
            >
              <LuClipboardPlus className="control-panel-icon transition" />
              <span className="centre container key transition">
                {' '}
                <LuChevronUp className="control-panel-icon transition" />
              </span>
              <span>+</span>
              <span className="centre container key transition">N</span>
            </button>
            <Divider vertical />
            <button
              className="centre control-panel-option no-drag transition pointer"
              onClick={toggleExpand}
            >
              <LuFileStack className="control-panel-icon transition" />
            </button>
            <Divider vertical />
            <button className="centre control-panel-option no-drag transition pointer">
              <LuSettings className="control-panel-icon transition" />
            </button>
            <Divider vertical />
            <button
              className="centre control-panel-option no-drag transition pointer"
              onClick={handleClose}
            >
              <LuX className="control-panel-icon transition" />
            </button>
          </div>
        </div>
        {isExpanded ? <Catalogue notes={notes} /> : <></>}
      </div>
    </Frame>
  )
}

export default ControlPanel
