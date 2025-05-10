import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // Window management APIs
  changeOpacity: (value: number) => ipcRenderer.invoke('change-opacity', value),
  createNote: (data?: { name: string }) => ipcRenderer.invoke('create-note', data),
  openNote: (data?: { name: string }) => ipcRenderer.invoke('open-note', data),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // Toggle functionality APIs
  buttonToggleHide: () => ipcRenderer.invoke('button-toggle-hide'),
  buttonToggleEdit: () => ipcRenderer.invoke('button-toggle-edit'),

  // Event listeners
  onToggleEdit: (callback: (state: { edit: boolean; shortcut: boolean }) => void) =>
    ipcRenderer.on('shortcut-toggle-edit', (_event, value) => callback(value)),

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
