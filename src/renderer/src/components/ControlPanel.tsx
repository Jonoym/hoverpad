import { useEffect } from 'react'
import Frame from './Frame'
import './ControlPanel.css'
import {
  LuPencil,
  LuPencilOff,
  LuEye,
  LuSunMoon,
  LuClipboardPlus,
  LuSettings,
  LuFolderSearch,
  LuChevronUp,
  LuX
} from 'react-icons/lu'
import { useState } from 'react'
import Divider from './Divider'
import { handleClose } from '@renderer/functions'

const ControlPanel = (): React.ReactElement => {
  const [opacity, setOpacity] = useState(100)
  const [isEditable, setIsEditable] = useState(true)

  useEffect(() => {
    window.api.onToggleEdit((editable: boolean): void => {
      setIsEditable(editable)
    })

    return () => {
      window.api.onToggleEdit(() => {})
    }
  }, [])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = Number(e.target.value)
    setOpacity(value)
    e.target.style.setProperty('--slider-value', `${value}%`)

    window.api.changeOpacity(value / 100)
  }

  const createNote = (): void => {
    window.api.createNote({
      name: 'New Note'
    })
  }

  const toggleEdit = (): void => {
    window.api.buttonToggleEdit()
  }

  const toggleHide = (): void => {
    window.api.buttonToggleHide()
  }

  return (
    <Frame>
      <div className="control-panel spaced">
        <div className="control-panel-container centre">
          <button
            className={`centre control-panel-option transition pointer ${isEditable ? 'control-panel-option-active' : 'control-panel-option-inactive'}`}
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
          <Divider />
          <button className="centre control-panel-option transition pointer" onClick={toggleHide}>
            <LuEye className="control-panel-icon transition" />
            <span className="centre container key transition">
              {' '}
              <LuChevronUp className="control-panel-icon transition" />
            </span>
            <span>+</span>
            <span className="centre container key transition">H</span>
          </button>
          <Divider />
          <div className="centre control-panel-option transition">
            <LuSunMoon className="control-panel-icon transition" />
            <div className="slider-container">
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
          <Divider />
          <button className="centre control-panel-option transition pointer" onClick={createNote}>
            <LuClipboardPlus className="control-panel-icon transition" />
            <span className="centre container key transition">
              {' '}
              <LuChevronUp className="control-panel-icon transition" />
            </span>
            <span>+</span>
            <span className="centre container key transition">N</span>
          </button>
          <Divider />
          <button className="centre control-panel-option transition pointer">
            <LuFolderSearch className="control-panel-icon transition" />
          </button>
          <Divider />
          <button className="centre control-panel-option transition pointer">
            <LuSettings className="control-panel-icon transition" />
          </button>
          <Divider />
          <button className="centre control-panel-option transition pointer" onClick={handleClose}>
            <LuX className="control-panel-icon transition" />
          </button>
        </div>
      </div>
    </Frame>
  )
}

export default ControlPanel
