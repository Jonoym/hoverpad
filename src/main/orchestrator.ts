// The orchestrator is responsible for receiving data and calling the necessary
// functions to use it somewhere

// ASYNC and EXCEPTION HANDLING

import { IpcMainInvokeEvent } from 'electron'
import { FileLayer } from './fileLayer'
import { StateLayer } from './stateLayer'
import { WindowLayer } from './windowLayer'

// Dependencies are on the stateLayer and fileLayer

const refreshWindowStates = async () => {
  FileLayer.saveWindowBounds()

  const notes = await FileLayer.getNotesList()

  const updateNoteDetails = StateLayer.updateActiveStatus(notes)

  WindowLayer.updateControlPanel(updateNoteDetails)
}

export const Orchestrator = {
  initialiseState: async () => {
    const titles = (await FileLayer.getNotesList()).map((note) => note.title)
    StateLayer.saveTitles(titles)
  },

  // Windows
  createWindow: async () => {
    const config = await FileLayer.getConfig()
    StateLayer.saveConfig(config)

    WindowLayer.createControlPanel()

    refreshWindowStates()
  },

  closeWindow: async (event: IpcMainInvokeEvent) => {
    WindowLayer.closeWindow(event)

    refreshWindowStates()
  },

  // Control Panel
  changeOpacity: async (_, opacity: number) => {
    StateLayer.updateOpacity(opacity)

    WindowLayer.updateOpacity()

    FileLayer.saveConfig()
  },

  toggleHide: async () => {
    StateLayer.toggleHide()

    WindowLayer.updateHide()

    FileLayer.saveConfig()
  },

  toggleEdit: async () => {
    StateLayer.toggleEdit()

    WindowLayer.updateEdit()

    FileLayer.saveConfig()
  },
  toggleExpand: async () => {
    StateLayer.toggleExpand()

    WindowLayer.updateExpand()

    FileLayer.saveConfig()
  },

  // Note
  createNote: async () => {
    const defaultTitle = FileLayer.getDefaultTitle()

    WindowLayer.openNote(defaultTitle, '')

    refreshWindowStates()
  },

  openNote: async (_, title: string) => {
    const content = await FileLayer.getNoteContent(title)

    if (!WindowLayer.checkNoteOpen(title)) WindowLayer.openNote(title, content)
    else WindowLayer.focusNote(title)
    refreshWindowStates()
  },

  closeNote: async (_, title: string) => {
    WindowLayer.closeNote(title)

    refreshWindowStates()
  },

  saveNote: async (
    event: IpcMainInvokeEvent,
    title: string,
    previousTitle: string,
    content: string
  ) => {
    if (title === '') return // TODO: Return Error

    StateLayer.saveNote(event, title, previousTitle)

    await FileLayer.saveNote(title, previousTitle, content)

    refreshWindowStates()
  },

  // Notes
  refreshNotes: async () => {
    refreshWindowStates()
  }
}
