// Functions separated by there use case to initialise the supported handlers
// These should be grouped and a main function to initialise should be exported

import { ipcMain, globalShortcut } from 'electron'
import {
  CHANGE_OPACITY,
  CLOSE_WINDOW,
  CREATE_NOTE,
  DELETE_NOTE,
  OPEN_NOTE,
  REFRESH_NOTES,
  SAVE_NOTE,
  TOGGLE_EDIT,
  TOGGLE_EXPAND,
  TOGGLE_HIDE
} from '@shared/constants'
import { Orchestrator } from './orchestrator'

export const initialiseApplication = Orchestrator.createWindow

export const initialiseShortcuts = () => {
  globalShortcut.register('CommandOrControl+H', Orchestrator.toggleHide)
  globalShortcut.register('CommandOrControl+E', Orchestrator.toggleEdit)
  globalShortcut.register('CommandOrControl+N', Orchestrator.createNote)
}

export const initialiseState = Orchestrator.initialiseState

export const initialiseHandlers = () => {
  ipcMain.handle(CLOSE_WINDOW, Orchestrator.closeWindow)

  // Control Panel Changes
  ipcMain.handle(CHANGE_OPACITY, Orchestrator.changeOpacity)
  ipcMain.handle(TOGGLE_HIDE, Orchestrator.toggleHide)
  ipcMain.handle(TOGGLE_EDIT, Orchestrator.toggleEdit)
  ipcMain.handle(TOGGLE_EXPAND, Orchestrator.toggleExpand)

  // Window State Changes
  ipcMain.handle(CREATE_NOTE, Orchestrator.createNote)
  ipcMain.handle(OPEN_NOTE, Orchestrator.openNote)
  ipcMain.handle(DELETE_NOTE, Orchestrator.deleteNote)
  ipcMain.handle(SAVE_NOTE, Orchestrator.saveNote)

  // Notes
  ipcMain.handle(REFRESH_NOTES, Orchestrator.refreshNotes)
}
