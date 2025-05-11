import { ElectronAPI } from '@electron-toolkit/preload'
import { NoteInfo } from '@shared/types'

interface API {
  changeOpacity(value: number): Promise<{ success: boolean; error?: string }>
  createNote: () => Promise<{ success: boolean; error?: string }>
  openNote: (filename: string) => Promise<{ success: boolean; windowId?: number; error?: string }>

  closeWindow: () => Promise<{ success: boolean; error?: string }>
  toggleHide: () => Promise<{ success: boolean; error?: string }>
  toggleEdit: () => Promise<{ success: boolean; error?: string }>
  toggleExpand: () => Promise<{ success: boolean; error?: string }>
  requestNotes: () => Promise<{ success: boolean; error?: string }>

  onToggleEdit: (callback: (editable: boolean) => void) => void
  onNotesList: (callback: (notes: Array<NoteInfo>) => void) => void
  saveContent: (title: string, content: string) => Promise<{ success: boolean; error?: string }>

  getWindowInfo: () => {
    windowType: string
    editable: boolean
    data: Record<string, string>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
