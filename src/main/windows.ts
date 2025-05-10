import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { WindowType } from '@shared/constants'

interface ApplicationInfo {
  hidden: boolean
  editable: boolean
  opacity: number
}

interface WindowRegistry {
  main: BrowserWindow | null
  notes: Map<number, BrowserWindow>
}

interface NotepadWindow {
  noteWindow: BrowserWindow
  windowId: number
}

let nextWindowId = 1

export const windows: WindowRegistry = {
  main: null,
  notes: new Map()
}

export const appInfo: ApplicationInfo = {
  hidden: false,
  editable: true,
  opacity: 1
}

export const createControlPanel = (): BrowserWindow => {
  const controlPanelWindow = new BrowserWindow({
    width: 883,
    height: 59,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: true,
    fullscreenable: false,
    icon: join(__dirname, '../../resources/icon.png'),
    ...(process.platform === 'linux' ? { icon: join(__dirname, '../../resources/icon.png') } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const windowParams = new URLSearchParams({
    windowType: 'CONTROL_PANEL'
  }).toString()

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    controlPanelWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?${windowParams}`)
  } else {
    controlPanelWindow.loadFile(join(__dirname, '../renderer/index.html'), { search: windowParams })
  }

  windows.main = controlPanelWindow

  controlPanelWindow.on('closed', () => {
    windows.main = null
    windows.notes.forEach((win) => {
      if (!win.isDestroyed()) win.close()
    })
    windows.notes.clear()
  })

  return controlPanelWindow
}

export const createNotepad = (data: { name: string }): NotepadWindow => {
  const windowId = nextWindowId++

  const noteWindow = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    fullscreenable: false,
    parent: windows.main || undefined,
    icon: join(__dirname, '../../resources/icon.png'),
    ...(process.platform === 'linux' ? { icon: join(__dirname, '../../resources/icon.png') } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const windowParams = new URLSearchParams({
    windowType: WindowType.Note,
    windowId: windowId.toString(),
    ...{ editable: appInfo.editable.toString(), ...data }
  }).toString()

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    noteWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?${windowParams}`)
  } else {
    noteWindow.loadFile(join(__dirname, '../renderer/index.html'), { search: windowParams })
  }

  windows.notes.set(windowId, noteWindow)

  noteWindow.on('closed', () => {
    windows.notes.delete(windowId)
  })

  noteWindow.setIgnoreMouseEvents(!appInfo.editable)
  noteWindow.setOpacity(appInfo.opacity)

  noteWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return { noteWindow, windowId }
}
