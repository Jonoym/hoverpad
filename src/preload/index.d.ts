// Separate the API into logical groupings for what they do
// Make use of zod

import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  changeOpacity(opacity: number): Promise<{ success: boolean; error?: string }>
  createNote: () => Promise<{ success: boolean; error?: string }>
  openNote: (title: string) => Promise<{ success: boolean; windowId?: number; error?: string }>
  deleteNote: (title: string) => Promise<{ success: boolean; error?: string }>

  closeWindow: () => Promise<{ success: boolean; error?: string }>
  toggleHide: () => Promise<{ success: boolean; error?: string }>
  toggleEdit: () => Promise<{ success: boolean; error?: string }>
  toggleExpand: () => Promise<{ success: boolean; error?: string }>
  requestNotes: () => Promise<{ success: boolean; error?: string }>

  onToggleEdit: (callback: (editable: boolean) => void) => void
  onNotesList: (callback: (notes: Array<NoteInfo>) => void) => void
  saveContent: (
    title: string,
    previousTitle: string,
    content: string
  ) => Promise<{ success: boolean; error?: string }>

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
