// Definitions for the main that are electron specific

import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import {
  initialiseApplication,
  initialiseHandlers,
  initialiseShortcuts,
  initialiseState
} from './handlers'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initialiseApplication()

  initialiseShortcuts()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) initialiseApplication()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

initialiseState()

initialiseHandlers()
