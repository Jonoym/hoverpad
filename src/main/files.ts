import { homedir } from 'os'
import { ensureDir, readFile, readdir, rename, remove, stat, writeFile } from 'fs-extra'

import {
  appDirectoryName,
  archiveDirectoryName,
  configFileName,
  configurationsDirectoryName,
  metadataFileName,
  notesDirectoryName
} from '@shared/constants'
import { ApplicationConfiguration, WindowMetadata } from '@shared/types'
import { appState } from './state'
import { BrowserWindow } from 'electron'

export const getRootDirectory = () => `${homedir()}/${appDirectoryName}`

export const getNotesDirectory = () => `${getRootDirectory()}/${notesDirectoryName}`

export const getArchiveDirectory = () => `${getRootDirectory()}/${archiveDirectoryName}`

export const getConfigurationDirectory = () =>
  `${getRootDirectory()}/${configurationsDirectoryName}`

const convertTitleToFile = (title: string) => `${title.toLowerCase().replaceAll(' ', '-')}`

const convertFileToTitle = (title: string) => title.replaceAll('-', ' ').replaceAll(/\.md$/, '')

export const getNotes = async () => {
  const notesDir = getNotesDirectory()

  ensureDir(notesDir)

  const notes = (await readdir(notesDir)).filter((filename) => filename.endsWith('.md'))

  return Promise.all(notes.map((filename) => getNoteInfo(filename, notesDir)))
}

export const getNoteInfo = async (filename: string, notesDir: string) => {
  const stats = await stat(`${notesDir}/${filename}`)

  return { title: convertFileToTitle(filename), lastEditTime: stats.mtimeMs }
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

export const updateTitle = (window: BrowserWindow, title: string): boolean => {
  console.log(`Attempting to update Title: ${title}`)
  const files = appState.files
  const previousTitle = appState.files.browserToTitle.get(window)

  if (previousTitle) {
    console.log(` Previous Title: ${previousTitle}`)
    files.titleToBrowser.delete(previousTitle)
    files.titles.delete(previousTitle)
    renameNote(previousTitle, title)
  } else {
    console.log(`Creating New Note with Title: ${title}`)
    createNote(title)
  }
  appState.files.browserToTitle.set(window, title)

  return true
}

export const saveContent = (title: string, content: string): boolean => {
  console.log(`Attempting to save Title: ${title}`)

  if (title) {
    writeNoteContent(title, content)
    return true
  }
  return false
}
