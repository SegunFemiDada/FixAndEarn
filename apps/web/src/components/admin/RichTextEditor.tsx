// Path: apps/web/src/components/admin/RichTextEditor.tsx
"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import DOMPurify from "dompurify";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      Placeholder.configure({
        placeholder: placeholder || "Write here...",
      }),
    ],

    content: value,
    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const clean = DOMPurify.sanitize(html);
      onChange(clean);
    },

    editorProps: {
      attributes: {
        class: `
          prose
          prose-sm
          dark:prose-invert
          max-w-none
          min-h-[200px]
          rounded-xl
          border
          border-[#C5D5EE]
          dark:border-[#2D3F55]
          bg-[#F4F8FF]
          dark:bg-[#16202E]
          px-4
          py-3
          text-[#1A2B4A]
          dark:text-[#E8F0FA]
          leading-7
          text-justify
          focus:outline-none

          [&_ol]:list-decimal
          [&_ol]:pl-6

          [&_ul]:list-disc
          [&_ul]:pl-6

          [&_li]:my-2
          [&_li]:leading-7

          [&_p]:text-justify
          [&_h1]:text-left
          [&_h2]:text-left
          [&_h3]:text-left
        `,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  return <EditorContent editor={editor} />;
}