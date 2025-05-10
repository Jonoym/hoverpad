export type NoteInfo = {
  name: string
  lastModifiedTime: number
}

export type ApplicationConfiguration = {
  hidden: boolean
  editable: boolean
  opacity: number
  expanded: boolean
}

export type WindowMetadata = {
  filename: string
  tags: Array<string>
}
