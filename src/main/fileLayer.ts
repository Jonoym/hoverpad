// This file should only have information about the models that are being used
// Everything else should not have side effects with the except of file saving
import { homedir } from 'os'
import { ensureDir, readFile, readdir, remove, stat, writeFile } from 'fs-extra'
import {
  appDirectoryName,
  configFilename,
  configurationsDirectoryName,
  notesDirectoryName,
  windowsFilename
} from '@shared/constants'
import { ApplicationConfiguration, NoteDetails, WindowBounds } from '@shared/types'
import { appState, DEFAULT_CONFIG } from './state'

const UNTITLED_ATTEMPT_MAX = 100

const getRootDirectory = () => `${homedir()}/${appDirectoryName}`

const getNotesDirectory = () => `${getRootDirectory()}/${notesDirectoryName}`

const getConfigurationDirectory = () => `${getRootDirectory()}/${configurationsDirectoryName}`

const getNoteInfo = async (filename: string, notesDir: string): Promise<NoteDetails> => {
  const stats = await stat(`${notesDir}/${filename}`)

  return { title: filename.replace(/\.md$/, ''), active: true, lastModifiedTime: stats.mtimeMs }
}

export const FileLayer = {
  // Helper
  getDefaultTitle: (): string => {
    console.log(`[FILE LAYER] getDefaultTitle()`)
    for (let i = 1; i < UNTITLED_ATTEMPT_MAX; i++) {
      if (!appState.files.titles.has(`Untitled ${i}`)) {
        console.log(`[FILE LAYER]   Default Title: Untitled ${i}`)
        return `Untitled ${i}`
      }
    }

    console.log(`[FILE LAYER]   Using Empty Name`)
    return ''
  },

  // Application Config
  getWindowBounds: async (): Promise<WindowBounds[]> => {
    console.log(`[FILE LAYER] getWindowBounds()`)

    const configDir = getConfigurationDirectory()

    ensureDir(configDir)

    try {
      const config = await readFile(`${configDir}/${windowsFilename}`, 'utf8')
      return JSON.parse(config) as WindowBounds[]
    } catch (error) {
      console.error(`[FILE LAYER]   Failed to load Config: ${error}`)
      return []
    }
  },

  saveWindowBounds: () => {
    console.log(`[FILE LAYER] saveWindowBounds()`)
    const configDir = getConfigurationDirectory()

    ensureDir(configDir)

    return writeFile(`${configDir}/${windowsFilename}`, JSON.stringify(appState.windows.windows))
  },

  getConfig: async (): Promise<ApplicationConfiguration> => {
    console.log(`[FILE LAYER] getConfig()`)

    const configDir = getConfigurationDirectory()

    ensureDir(configDir)

    try {
      const config = await readFile(`${configDir}/${configFilename}`, 'utf8')
      return JSON.parse(config) as ApplicationConfiguration
    } catch (error) {
      console.error(`[FILE LAYER]   Failed to load Config: ${error}`)
      return DEFAULT_CONFIG
    }
  },

  saveConfig: () => {
    console.log(`[FILE LAYER] saveConfig()`)
    const configDir = getConfigurationDirectory()

    ensureDir(configDir)

    return writeFile(`${configDir}/${configFilename}`, JSON.stringify(appState.config))
  },

  // Notes
  saveNote: async (title: string, previousTitle: string, content: string) => {
    console.log(`[FILE LAYER] saveNote(${title}, ${previousTitle})`)

    const notesDir = getNotesDirectory()

    ensureDir(notesDir)

    await Promise.all([
      title !== previousTitle ? remove(`${notesDir}/${previousTitle}.md`) : Promise.resolve(),
      writeFile(`${notesDir}/${title}.md`, content)
    ])
  },

  getNoteContent: async (title: string): Promise<string> => {
    console.log(`[FILE LAYER] getNoteContent(${title})`)

    const notesDir = getNotesDirectory()

    ensureDir(notesDir)

    return await readFile(`${notesDir}/${title}.md`, 'utf-8')
  },

  // Notes List
  getNotesList: async (): Promise<Array<NoteDetails>> => {
    const notesDir = getNotesDirectory()

    ensureDir(notesDir)

    const notes = (await readdir(notesDir)).filter((file) => file.endsWith('.md'))
    return await Promise.all(notes.map((filename) => getNoteInfo(filename, notesDir)))
  }
}
