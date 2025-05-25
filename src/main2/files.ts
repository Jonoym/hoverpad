import { homedir } from 'os'
import { ensureDir, readFile, readdir, rename, remove, stat, writeFile } from 'fs-extra'

import {
  appDirectoryName,
  archiveDirectoryName,
  configFileName,
  configurationsDirectoryName,
  metadataFileName,
  notesDirectoryName,
  SEND_NOTES_LIST
} from '@shared/constants'
import { ApplicationConfiguration, NoteInfo, WindowMetadata } from '@shared/types'
import { appState } from './state'
import { BrowserWindow } from 'electron'

export const getRootDirectory = () => `${homedir()}/${appDirectoryName}`

export const getNotesDirectory = () => `${getRootDirectory()}/${notesDirectoryName}`

export const getArchiveDirectory = () => `${getRootDirectory()}/${archiveDirectoryName}`

export const getConfigurationDirectory = () =>
  `${getRootDirectory()}/${configurationsDirectoryName}`

const convertTitleToFile = (title: string) => `${title.toLowerCase().replaceAll(' ', '-')}`

const convertFileToTitle = (title: string) => title.replaceAll('-', ' ').replace(/\.md$/, '')

export const getNotes = async (): Promise<NoteInfo[]> => {
  const notesDir = getNotesDirectory()

  ensureDir(notesDir)

  const notes = (await readdir(notesDir)).filter((filename) => filename.endsWith('.md'))

  return await Promise.all(notes.map((filename) => getNoteInfo(filename, notesDir)))
  // return notes.map((filename): NoteInfo => {
  //   return { name: filename, lastModifiedTime: 0 }
  // })
}

export const getNoteInfo = async (filename: string, notesDir: string): Promise<NoteInfo> => {
  const stats = await stat(`${notesDir}/${filename}`)

  return { name: convertFileToTitle(filename), lastModifiedTime: stats.mtimeMs }
}

export const getNoteContent = async (title: string) => {
  const notesDir = getNotesDirectory()

  ensureDir(notesDir)

  return await readFile(`${notesDir}/${convertTitleToFile(title)}.md`, 'utf-8')
}

export const createNote = async (title: string) => {
  const notesDir = getNotesDirectory()

  ensureDir(notesDir)

  return writeFile(`${notesDir}/${convertTitleToFile(title)}.md`, '')
}

export const writeNoteContent = async (title: string, content: string) => {
  const notesDir = getNotesDirectory()

  ensureDir(notesDir)

  return writeFile(`${notesDir}/${convertTitleToFile(title)}.md`, content)
}

export const renameNote = async (previousTitle: string, newTitle: string) => {
  const notesDir = getNotesDirectory()

  ensureDir(notesDir)

  console.log(`Renaming Note from ${previousTitle} to ${newTitle}`)

  await rename(
    `${notesDir}/${convertTitleToFile(previousTitle)}.md`,
    `${notesDir}/${convertTitleToFile(newTitle)}.md`
  )
}

export const archiveNote = async (title: string) => {
  const notesDir = getNotesDirectory()
  const archiveDir = getArchiveDirectory()

  await rename(
    `${notesDir}/${convertTitleToFile(title)}.md`,
    `${archiveDir}/${convertTitleToFile(title)}.md`
  )
}

export const deleteNote = async (title: string) => {
  const archiveDir = getArchiveDirectory()
  ensureDir(archiveDir)

  await remove(`${archiveDir}/${convertTitleToFile(title)}.md`)
}

export const loadConfiguration = async (): Promise<ApplicationConfiguration | null> => {
  const configDir = getConfigurationDirectory()

  ensureDir(configDir)

  try {
    const config = await readFile(`${configDir}/${configFileName}`, 'utf8')
    return JSON.parse(config) as ApplicationConfiguration
  } catch (error) {
    console.error(`Failed to parse Configuration File: ${error}`)
    return null
  }
}

export const loadMetadata = async (): Promise<Record<string, WindowMetadata>> => {
  const configDir = getConfigurationDirectory()

  ensureDir(configDir)

  try {
    const metadata = await readFile(`${configDir}/${metadataFileName}`, 'utf8')
    return JSON.parse(metadata) as Record<string, WindowMetadata>
  } catch (error) {
    console.error(`Failed to parse Metadata File: ${error}`)
    return {}
  }
}

export const saveConfiguration = async (config: ApplicationConfiguration) => {
  const configDir = getConfigurationDirectory()

  ensureDir(configDir)

  return writeFile(`${configDir}/${configFileName}`, JSON.stringify(config))
}

export const saveMetadata = async (metadata: Record<string, WindowMetadata>) => {
  const configDir = getConfigurationDirectory()

  ensureDir(configDir)

  return writeFile(`${configDir}/${configFileName}`, JSON.stringify(metadata))
}

// Higher Order Functions

export const getNotesList = async () => {
  const notes = await getNotes()
  appState.windows.main?.webContents.send(SEND_NOTES_LIST, notes)
}

export const updateTitle = async (window: BrowserWindow, title: string): Promise<boolean> => {
  console.log(`Attempting to update Title: ${title}`)
  const files = appState.files
  const previousTitle = appState.files.browserToTitle.get(window)

  if (previousTitle) {
    console.log(` Previous Title: ${previousTitle}`)
    files.titleToBrowser.delete(previousTitle)
    files.titles.delete(previousTitle)
    await renameNote(previousTitle, title)
  }
  appState.files.browserToTitle.set(window, title)
  getNotesList()

  return true
}

export const saveContent = async (title: string, content: string): Promise<boolean> => {
  console.log(`Attempting to save Title: ${title}`)

  if (title) {
    await writeNoteContent(title, content)
    return true
  }
  return false
}
