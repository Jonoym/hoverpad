import {
  MDXEditor,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  headingsPlugin,
  tablePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  quotePlugin,
  InsertTable,
  listsPlugin,
  BoldItalicUnderlineToggles,
  markdownShortcutPlugin,
  ListsToggle
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import './editor.css'
import { debounce } from 'lodash'

interface EditorProps {
  setContent: (value: string) => void
}

function Editor({ setContent }: EditorProps) {
  const handleContentChange = debounce((content) => {
    setContent(content)
  }, 1000)

  return (
    <MDXEditor
      className="dark-theme"
      contentEditableClassName="prose"
      markdown="> This is a quote"
      onChange={(e) => handleContentChange(e)}
      plugins={[
        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        quotePlugin(),
        listsPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'markdown' }),
        codeMirrorPlugin({
          codeBlockLanguages: {
            markdown: 'Markdown',
            txt: 'Plain Text'
          }
        }),
        thematicBreakPlugin(),
        tablePlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <InsertTable />
              <BoldItalicUnderlineToggles />
              <ListsToggle />
            </>
          )
        }),
        markdownShortcutPlugin()
      ]}
    />
  )
}

export default Editor
