import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Code from '@tiptap/extension-code'
import CodeBlock from '@tiptap/extension-code-block'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import BlockQuote from '@tiptap/extension-blockquote'
import HardBreak from '@tiptap/extension-hard-break'
import Link from '@tiptap/extension-link'
import type { Extensions } from '@tiptap/react'

export const extensions: Extensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Strike,
  Code,
  CodeBlock,
  Heading.configure({
    levels: [1, 2, 3, 4, 5, 6],
  }),
  BulletList,
  OrderedList,
  ListItem,
  BlockQuote,
  HardBreak,
  Link.configure({
    openOnClick: false,
  }),
  Placeholder.configure({
    placeholder: '输入 / 打开命令菜单...',
  }),
]

export const editorProps = {
  attributes: {
    class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px]',
  }
} 