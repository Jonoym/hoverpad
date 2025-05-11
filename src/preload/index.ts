import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  CHANGE_OPACITY,
  CLOSE_WINDOW,
  CREATE_NOTE,
  OPEN_NOTE,
  REQUEST_NOTES_LIST,
  SAVE_CONTENT,
  SEND_NOTES_LIST,
  SEND_TOGGLE_EDIT,
  TOGGLE_EDIT,
  TOGGLE_EXPAND,
  TOGGLE_HIDE
} from '@shared/constants'
import { NoteInfo } from '@shared/types'

const api = {
  // Window management APIs
  changeOpacity: (value: number) => ipcRenderer.invoke(CHANGE_OPACITY, value),
  createNote: (data?: { name: string }) => ipcRenderer.invoke(CREATE_NOTE, data),
  closeWindow: () => ipcRenderer.invoke(CLOSE_WINDOW),
  openNote: (filename: string) => ipcRenderer.invoke(OPEN_NOTE, filename),

  // Toggle functionality APIs
  toggleHide: () => ipcRenderer.invoke(TOGGLE_HIDE),
  toggleEdit: () => ipcRenderer.invoke(TOGGLE_EDIT),
  toggleExpand: () => ipcRenderer.invoke(TOGGLE_EXPAND),

  // File APIs
  saveContent: (title: string, content: string) => ipcRenderer.invoke(SAVE_CONTENT, title, content),
  requestNotes: () => ipcRenderer.invoke(REQUEST_NOTES_LIST),

  // Event listeners
  onToggleEdit: (callback: (editable: boolean) => void) =>
    ipcRenderer.on(SEND_TOGGLE_EDIT, (_event, value) => callback(value)),
  onNotesList: (callback: (notes: Array<NoteInfo>) => void) =>
    ipcRenderer.on(SEND_NOTES_LIST, (_event, value) => callback(value)),

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
