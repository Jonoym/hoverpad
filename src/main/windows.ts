import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { WindowType } from '@shared/constants'
import { appState } from './state'
import { getNoteContent } from './files'

let nextWindowId = 1

type WindowState = {
  width: number
  height: number
  x: number
  y: number
}

export const controlPanelClosed: WindowState = {
  width: 883,
  height: 62,
  x: 0,
  y: 0
}

export const controlPanelOpen: WindowState = {
  width: 883,
  height: 500,
  x: 0,
  y: 0
}

export const createControlPanel = (): BrowserWindow => {
  const windowState = appState.config.expanded ? controlPanelOpen : controlPanelClosed

  const controlPanelWindow = new BrowserWindow({
    x: 100,
    y: 100,
    width: windowState.width,
    height: windowState.height,
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

  appState.windows.main = controlPanelWindow

  controlPanelWindow.on('closed', () => {
    appState.windows.main = null
    appState.windows.idToNoteBrowser.forEach((win) => {
      if (!win.isDestroyed()) win.close()
    })
    appState.windows.idToNoteBrowser.clear()
  })

  return controlPanelWindow
}

export const createNotepad = async (filename?: string): Promise<number> => {
  const windowId = nextWindowId++

  const noteWindow = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    fullscreenable: false,
    parent: appState.windows.main || undefined,
    icon: join(__dirname, '../../resources/icon.png'),
    ...(process.platform === 'linux' ? { icon: join(__dirname, '../../resources/icon.png') } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const content = filename ? await getNoteContent(filename) : ''

  filename = filename ? filename : 'Untitled'

  const windowParams = new URLSearchParams({
    windowType: WindowType.Note,
    windowId: windowId.toString(),
    ...{
      editable: appState.config.editable.toString(),
      filename: filename,
      content: content
    }
  }).toString()

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    noteWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?${windowParams}`)
  } else {
    noteWindow.loadFile(join(__dirname, '../renderer/index.html'), { search: windowParams })
  }

  appState.windows.idToNoteBrowser.set(windowId, noteWindow)
  appState.files.titleToBrowser.set(filename, noteWindow)
  appState.files.browserToTitle.set(noteWindow, filename)

  noteWindow.on('closed', () => {
    appState.windows.idToNoteBrowser.delete(windowId)
  })

  noteWindow.setIgnoreMouseEvents(!appState.config.editable)
  noteWindow.setOpacity(appState.config.opacity)

  noteWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return windowId
}
