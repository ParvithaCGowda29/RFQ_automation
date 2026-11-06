// Editable cover letter, same editor library BAM_UI uses (TipTap). Content is mock;
// editing is real and stays in the browser - nothing is sent anywhere in this demo.
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export function CoverLetterEditor({ content }: { content: string }) {
  const editor = useEditor({ extensions: [StarterKit], content });
  const btn = (label: string, run: () => void, on?: boolean, title?: string) => (
    <button key={label} type="button" title={title || label} className={"tt-b" + (on ? " on" : "")} onMouseDown={e => e.preventDefault()} onClick={run}>{label}</button>
  );
  return (
    <div className="tt-wrap">
      <div className="tt-bar">
        {btn("B", () => editor?.chain().focus().toggleBold().run(), editor?.isActive("bold"), "Bold")}
        {btn("I", () => editor?.chain().focus().toggleItalic().run(), editor?.isActive("italic"), "Italic")}
        {btn("U", () => editor?.chain().focus().toggleUnderline?.().run?.() ?? editor?.chain().focus().run(), editor?.isActive("underline"), "Underline")}
        {btn("\u2022 List", () => editor?.chain().focus().toggleBulletList().run(), editor?.isActive("bulletList"), "Bullet list")}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
