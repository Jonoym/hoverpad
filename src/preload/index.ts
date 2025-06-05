import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  CHANGE_OPACITY,
  CLOSE_WINDOW,
  CREATE_NOTE,
  DELETE_NOTE,
  OPEN_NOTE,
  REFRESH_NOTES,
  SAVE_NOTE,
  SEND_NOTES_LIST,
  SEND_OPACITY,
  SEND_TOGGLE_EDIT,
  TOGGLE_EDIT,
  TOGGLE_EXPAND,
  TOGGLE_HIDE
} from '@shared/constants'
import { NoteDetails } from '@shared/types'

const api = {
  // Window management APIs
  changeOpacity: (opacity: number) => ipcRenderer.invoke(CHANGE_OPACITY, opacity),
  createNote: () => ipcRenderer.invoke(CREATE_NOTE),
  closeWindow: () => ipcRenderer.invoke(CLOSE_WINDOW),
  openNote: (title: string) => ipcRenderer.invoke(OPEN_NOTE, title),
  deleteNote: (title: string) => ipcRenderer.invoke(DELETE_NOTE, title),

  // Toggle functionality APIs
  toggleHide: () => ipcRenderer.invoke(TOGGLE_HIDE),
  toggleEdit: () => ipcRenderer.invoke(TOGGLE_EDIT),
  toggleExpand: () => ipcRenderer.invoke(TOGGLE_EXPAND),

  // File APIs
  saveContent: (title: string, previousTitle: string, content: string) =>
    ipcRenderer.invoke(SAVE_NOTE, title, previousTitle, content),
  requestNotes: () => ipcRenderer.invoke(REFRESH_NOTES),

  // Event listeners
  onToggleEdit: (callback: (editable: boolean) => void) =>
    ipcRenderer.on(SEND_TOGGLE_EDIT, (_event, value) => callback(value)),
  onNotesList: (callback: (notes: Array<NoteDetails>) => void) =>
    ipcRenderer.on(SEND_NOTES_LIST, (_event, value) => callback(value)),
  onOpacity: (callback: (opacity: number) => void) =>
    ipcRenderer.on(SEND_OPACITY, (_event, value) => callback(value)),

  getWindowInfo: () => {
    // Parse query parameters to get window type and ID
    const urlParams = new URLSearchParams(window.location.search)
    const windowType = urlParams.get('windowType') || 'main'
    const windowId = urlParams.get('windowId') ? parseInt(urlParams.get('windowId')!, 10) : null

    // Additional data passed when creating the window
    const data: Record<string, string> = {}
    urlParams.forEach((value, key) => {
      if (key !== 'windowType' && key !== 'windowId') {
        data[key] = value
      }
    })

    return { windowType, windowId, data }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
