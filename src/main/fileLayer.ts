// This file should only have information about the models that are being used
// Everything else should not have side effects with the except of file saving
import { homedir } from 'os'
import { ensureDirSync, readFile, readdir, remove, stat, writeFile } from 'fs-extra'
import {
  appDirectoryName,
  configFilename,
  configurationsDirectoryName,
  CONTROL_PANEL_ID,
  notesDirectoryName,
  windowsFilename
} from '@shared/constants'
import { ApplicationConfiguration, NoteDetails, WindowBounds } from '@shared/types'
import { appState, DEFAULT_CONFIG } from './state'
import { CONTROL_PANEL_CLOSED } from './windowLayer'
import { debounce } from 'lodash'

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
    console.log(`    [FILE LAYER  ] getDefaultTitle()`)
    for (let i = 1; i < UNTITLED_ATTEMPT_MAX; i++) {
      if (!appState.files.titles.has(`Untitled ${i}`)) {
        console.log(`    [FILE LAYER  ]   Default Title: Untitled ${i}`)
        return `Untitled ${i}`
      }
    }

    console.log(`    [FILE LAYER  ]   Using Empty Name`)
    return ''
  },

  // Application Config
  getWindowBounds: async (): Promise<WindowBounds[]> => {
    console.log(`    [FILE LAYER  ] getWindowBounds()`)

    const configDir = getConfigurationDirectory()

    ensureDirSync(configDir)

    try {
      const config = await readFile(`${configDir}/${windowsFilename}`, 'utf8')
      return JSON.parse(config) as WindowBounds[]
    } catch (error) {
      console.error(`    [FILE LAYER  ]   Failed to load Config: ${error}`)
      return []
    }
  },

  saveWindowArrangement: debounce(() => {
    console.log(`    [FILE LAYER  ] saveWindowArrangement()`)

    const configDir = getConfigurationDirectory()

    ensureDirSync(configDir)

    console.log(`    [FILE LAYER  ]   Windows: ${JSON.stringify(appState.windows.windows)}`)

    return writeFile(`${configDir}/${windowsFilename}`, JSON.stringify(appState.windows.windows))
  }, 1000),

  getConfig: async (): Promise<ApplicationConfiguration> => {
    console.log(`    [FILE LAYER  ] getConfig()`)

    const configDir = getConfigurationDirectory()

    ensureDirSync(configDir)

    try {
      const config = await readFile(`${configDir}/${configFilename}`, 'utf8')
      return JSON.parse(config) as ApplicationConfiguration
    } catch (error) {
      console.error(`    [FILE LAYER  ]   Failed to load Config: ${error}`)
      return DEFAULT_CONFIG
    }
  },

  getWindowArrangement: async (): Promise<Record<string, WindowBounds>> => {
    console.log(`    [FILE LAYER  ] getWindowArrangement()`)

    const configDir = getConfigurationDirectory()

    ensureDirSync(configDir)

    try {
      const config = await readFile(`${configDir}/${windowsFilename}`, 'utf8')
      return JSON.parse(config) as Record<string, WindowBounds>
    } catch (error) {
      console.error(`    [FILE LAYER  ]   Failed to load Config: ${error}`)
      const defaultArrangement = {}
      defaultArrangement[CONTROL_PANEL_ID] = {
        x: 100,
        y: 100,
        width: CONTROL_PANEL_CLOSED.width,
        height: CONTROL_PANEL_CLOSED.height
      }
      return defaultArrangement
    }
  },

  saveConfig: debounce(() => {
    console.log(`    [FILE LAYER  ] saveConfig()`)
    const configDir = getConfigurationDirectory()

    ensureDirSync(configDir)

    return writeFile(`${configDir}/${configFilename}`, JSON.stringify(appState.config))
  }, 1000),

  // Notes
  saveNote: async (title: string, previousTitle: string, content: string) => {
    console.log(`    [FILE LAYER  ] saveNote(${title}, ${previousTitle})`)

    const notesDir = getNotesDirectory()

    ensureDirSync(notesDir)

    await Promise.all([
      title !== previousTitle ? remove(`${notesDir}/${previousTitle}.md`) : Promise.resolve(),
      writeFile(`${notesDir}/${title}.md`, content)
    ])
  },

  getNoteContentBatch: async (): Promise<Array<[string, string] | null>> => {
    const titles = Object.keys(appState.windows.windows).filter(
      (title) => title !== CONTROL_PANEL_ID
    )

    console.log(`    [FILE LAYER  ] getNoteContentBatch(${JSON.stringify(titles)})`)

    const notesDir = getNotesDirectory()
    ensureDirSync(notesDir)

    return Promise.all(
      titles.map(async (title): Promise<[string, string] | null> => {
        try {
          const content = await readFile(`${notesDir}/${title}.md`, 'utf-8')
          return [title, content]
        } catch (error) {
          console.error(`    [FILE LAYER  ]   Failed to read note content for ${title}: ${error}`)
          return null
        }
      })
    )
  },

  getNoteContent: async (title: string): Promise<string> => {
    console.log(`    [FILE LAYER  ] getNoteContent(${title})`)

    const notesDir = getNotesDirectory()

    ensureDirSync(notesDir)

    return await readFile(`${notesDir}/${title}.md`, 'utf-8')
  },

  deleteNote(title: string): Promise<void> {
    console.log(`    [FILE LAYER  ] deleteNote(${title})`)

    const notesDir = getNotesDirectory()

    ensureDirSync(notesDir)

    return remove(`${notesDir}/${title}.md`)
  },

  // Notes List
  getNotesList: async (): Promise<Array<NoteDetails>> => {
    const notesDir = getNotesDirectory()

    ensureDirSync(notesDir)

    const notes = (await readdir(notesDir)).filter((file) => file.endsWith('.md'))
    return await Promise.all(notes.map((filename) => getNoteInfo(filename, notesDir)))
  }
}
