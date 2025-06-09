import { useEffect } from 'react'
import Frame from '../components/Frame'
import './ControlPanel.css'
import {
  LuGripVertical,
  LuPencil,
  LuPencilOff,
  LuEye,
  LuSunMoon,
  LuFileStack,
  LuChevronUp,
  LuX,
  LuFilePlus
} from 'react-icons/lu'
import { useState } from 'react'
import Divider from '../components/Divider'
import { createNote, handleClose } from '@renderer/functions'
import { Catalogue } from '@renderer/components'
import { NoteDetails } from '@shared/types'

export interface WindowInfo {
  windowType: string
  data: Record<string, string>
}

interface ControlPanelProps {
  windowInfo: WindowInfo
}

function ControlPanel({ windowInfo }: ControlPanelProps) {
  const [opacity, setOpacity] = useState(Number(windowInfo.data.opacity) * 100)
  const [isEditable, setIsEditable] = useState(windowInfo.data.editable === 'true')
  const [isExpanded, setIsExpanded] = useState(windowInfo.data.expanded === 'true')
  const [notes, setNotes] = useState<Array<NoteDetails>>([])

  useEffect(() => {
    window.api.onToggleEdit((editable: boolean): void => {
      setIsEditable(editable)
    })

    window.api.onNotesList((notes: Array<NoteDetails>) => {
      setNotes(notes)
    })

    window.api.onOpacity((opacity: number): void => {
      setOpacity(opacity * 100)
    })

    return () => {
      window.api.onToggleEdit(() => {})
      window.api.onNotesList(() => {})
      window.api.onOpacity(() => {})
    }
  }, [])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = Number(e.target.value)
    setOpacity(value)
    window.api.changeOpacity(value / 100)
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
    <Frame
      className={`transition ${isExpanded ? 'control-frame-expanded' : 'control-frame-closed'}`}
    >
      <div className="control-panel-window">
        <div className={`control-panel spaced`}>
          <div className="centre control-panel-drag transition">
            <LuGripVertical className="control-panel-icon transition" />
          </div>
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
              <LuFilePlus className="control-panel-icon transition" />
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
