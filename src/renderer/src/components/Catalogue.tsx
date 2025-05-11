import { useEffect } from 'react'
import './catalogue.css'
import Divider from './Divider'
import { NoteInfo } from '@shared/types'

interface CatalogueProps {
  notes: Array<NoteInfo>
}

function Catalogue({ notes }: CatalogueProps) {
  useEffect(() => {
    window.api.requestNotes()
  }, [])

  const openNote = (filename: string) => {
    window.api.openNote(filename)
  }

  return (
    <div className="note-catalogue transition no-drag">
      <div className="note-catalogue-header">
        {/* <div className="note-catalogue-tags">
          <div className="note-catalogue-tag"></div>
          <div className="note-catalogue-tag"></div>
          <div className="note-catalogue-tag"></div>
          <div className="note-catalogue-tag"></div>
          <div className="note-catalogue-tag"></div>
        </div>
        <input className="note-catalogue-search"></input> */}
      </div>
      <div className="note-section">
        <h3 className="note-section-header">Recent Notepads</h3>
        <div className="note-section-grid">
          {notes.map((note, index) => (
            <button
              key={index}
              className="note-button transition-fast"
              onClick={() => openNote(note.name)}
            >
              {note.name}
            </button>
          ))}
        </div>
        <Divider horizontal />
      </div>
    </div>
  )
}

export default Catalogue
