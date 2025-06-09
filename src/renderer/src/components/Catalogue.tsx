import { useEffect, useState } from 'react'
import './catalogue.css'
import { NoteDetails } from '@shared/types'
import { LuPlus, LuTrash2 } from 'react-icons/lu'
import Divider from './Divider'
import { createNote } from '@renderer/functions'

interface CatalogueProps {
  notes: Array<NoteDetails>
}

function Catalogue({ notes }: CatalogueProps) {
  const [filterTerm, setFilterTerm] = useState('')

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
      <div className="note-section">
        <div className="note-catalogue-header transition">
          <h3 className="note-catalogue-title transition">Collection</h3>
          <input
            className="transition"
            placeholder="Search"
            onChange={(e) => setFilterTerm(e.target.value)}
          ></input>
        </div>
        <Divider horizontal />
        <h4 className="note-section-header">Active Notepads</h4>
        <div className="note-section-grid">
          {notes
            .filter((note) => note.active)
            .sort((note) => note.lastModifiedTime)
            .map((note, index) => (
              <button
                key={index}
                className={`note-button transition-fast note-button-active ${note.title.includes(filterTerm) ? 'note-button-visible' : 'note-button-invisible'}`}
                onClick={() => openNote(note.title)}
              >
                <div className="note-button-label transition note-button-label-active">
                  {note.title}
                </div>
                <button
                  className="centre note-button-option no-drag transition pointer"
                  onClick={(event) => deleteNote(event, note.title)}
                >
                  <LuTrash2 className="note-button-icon" />
                </button>
              </button>
            ))}
          <button className="note-button" onClick={createNote}>
            <LuPlus className="note-button-icon" />
          </button>
        </div>
      </div>
      <div className="note-section">
        <h4 className="note-section-header">Notepads</h4>
        <div className="note-section-grid">
          {notes
            .filter((note) => !note.active)
            .sort((note) => note.lastModifiedTime)
            .map((note, index) => (
              <button
                key={index}
                className={`note-button transition-fast ${note.title.includes(filterTerm) ? 'note-button-visible' : 'note-button-invisible'}`}
                onClick={() => openNote(note.title)}
              >
                <div className="note-button-label transition-fast">{note.title}</div>
                <button
                  className="centre note-button-option no-drag transition pointer"
                  onClick={(event) => deleteNote(event, note.title)}
                >
                  <LuTrash2 className="note-button-icon" />
                </button>
              </button>
            ))}
        </div>
      </div>
      {/* <div className="note-section">
        <h4 className="note-section-header">Archive</h4>
        <div className="note-section-grid">
          {notes
            .filter((note) => !note.active)
            .sort((note) => note.lastModifiedTime)
            .map((note, index) => (
              <button
                key={index}
                className={`note-button transition-fast ${note.title.includes(filterTerm) ? 'note-button-visible' : 'note-button-invisible'}`}
                onClick={() => openNote(note.title)}
              >
                <div className="note-button-label transition-fast">{note.title}</div>
                <button
                  className="centre note-button-option no-drag transition pointer"
                  onClick={(event) => deleteNote(event, note.title)}
                >
                  <LuTrash2 className="note-button-icon" />
                </button>
              </button>
            ))}
        </div>
      </div> */}
    </div>
  )
}

export default Catalogue
