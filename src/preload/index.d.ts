// Separate the API into logical groupings for what they do
// Make use of zod

import { ElectronAPI } from '@electron-toolkit/preload'
import { Response } from '@shared/types'

interface API {
  changeOpacity(opacity: number): Promise<Response>
  createNote: () => Promise<Response>
  openNote: (title: string) => Promise<Response>
  deleteNote: (title: string) => Promise<Response>

  closeWindow: () => Promise<Response>
  toggleHide: () => Promise<Response>
  toggleEdit: () => Promise<Response>
  toggleExpand: () => Promise<Response>
  requestNotes: () => Promise<Response>

  onToggleEdit: (callback: (editable: boolean) => void) => void
  onNotesList: (callback: (notes: Array<NoteInfo>) => void) => void
  onOpacity: (callback: (opacity: number) => void) => void
  saveContent: (title: string, previousTitle: string, content: string) => Promise<Response>

  getWindowInfo: () => {
    windowType: string
    editable: boolean
    expnaded: boolean
    data: Record<string, string>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
