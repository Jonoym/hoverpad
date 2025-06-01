import { useEffect } from 'react'
import './catalogue.css'
import Divider from './Divider'
import { NoteDetails } from '@shared/types'
import { LuTrash2 } from 'react-icons/lu'

interface CatalogueProps {
  notes: Array<NoteDetails>
}

function Catalogue({ notes }: CatalogueProps) {
  useEffect(() => {
    window.api.requestNotes()
  }, [])

  const openNote = (title: string) => {
    window.api.openNote(title)
  }

  const deleteNote = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, title: string) => {
    event.stopPropagation()
    window.api.deleteNote(title)
  }

  return (
    <div className="note-catalogue transition no-drag">
      <div className="note-catalogue-header"></div>
      <div className="note-section">
        <h3 className="note-section-header">Active Notepads</h3>
        <div className="note-section-grid">
          {notes
            .filter((note) => note.active)
            .sort((note) => note.lastModifiedTime)
            .map((note, index) => (
              <button
                key={index}
                className="note-button transition-fast"
                onClick={() => openNote(note.title)}
              >
                <div className="note-button-label">{note.title}</div>
                <button
                  className="centre note-button-option no-drag transition pointer"
                  onClick={(event) => deleteNote(event, note.title)}
                >
                  <LuTrash2 className="note-button-icon" />
                </button>
              </button>
            ))}
        </div>
        <Divider horizontal />
      </div>
      <div className="note-section">
        <h3 className="note-section-header">Notepads</h3>
        <div className="note-section-grid">
          {notes
            .filter((note) => !note.active)
            .sort((note) => note.lastModifiedTime)
            .map((note, index) => (
              <button
                key={index}
                className="note-button transition-fast"
                onClick={() => openNote(note.title)}
              >
                <div className="note-button-label">{note.title}</div>
                <button
                  className="centre note-button-option no-drag transition pointer"
                  onClick={(event) => deleteNote(event, note.title)}
                >
                  <LuTrash2 className="note-button-icon" />
                </button>
              </button>
            ))}
        </div>
        <Divider horizontal />
      </div>
    </div>
  )
}

export default Catalogue
