import { useEffect } from 'react'
import './catalogue.css'
import Divider from './Divider'
import { NoteDetails } from '@shared/types'

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

  console.log(notes)

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
                {note.title}
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
                {note.title}
              </button>
            ))}
        </div>
        <Divider horizontal />
      </div>
    </div>
  )
}

export default Catalogue
