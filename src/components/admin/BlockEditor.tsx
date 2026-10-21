import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TableKit } from '@tiptap/extension-table';
import { Node, mergeAttributes } from '@tiptap/core';
import type { DoramiDocument, JsonNode } from '../../lib/types';

const DoramiImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-media-id'),
        renderHTML: (attributes) => attributes.mediaId ? { 'data-media-id': attributes.mediaId } : {},
      },
      width:{default:null,parseHTML:(element)=>element.getAttribute('data-width'),renderHTML:(attributes)=>attributes.width?{'data-width':attributes.width,style:'width:'+attributes.width+';max-width:100%'}:{}},
      alignment:{default:'center',parseHTML:(element)=>element.getAttribute('data-alignment')??'center',renderHTML:(attributes)=>({'data-alignment':attributes.alignment,class:'image-'+attributes.alignment})},
      caption:{default:'',parseHTML:(element)=>element.getAttribute('data-caption')??'',renderHTML:(attributes)=>attributes.caption?{'data-caption':attributes.caption}:{}},
    };
  },
});
const Callout = Node.create({ name:'callout', group:'block', content:'block+', parseHTML:()=>[{tag:'aside[data-callout]'}], renderHTML:({HTMLAttributes})=>['aside',mergeAttributes(HTMLAttributes,{'data-callout':'','class':'editor-callout'}),0] });
const DetailsSummary = Node.create({ name:'detailsSummary', content:'inline*', defining:true, parseHTML:()=>[{tag:'summary'}], renderHTML:()=>['summary',0] });
const DetailsContent = Node.create({ name:'detailsContent', content:'block+', defining:true, parseHTML:()=>[{tag:'div[data-details-content]'}], renderHTML:()=>['div',{'data-details-content':''},0] });
const Details = Node.create({ name:'details', group:'block', content:'detailsSummary detailsContent', parseHTML:()=>[{tag:'details'}], renderHTML:({HTMLAttributes})=>['details',mergeAttributes(HTMLAttributes,{'data-type':'toggle'}),0] });

type MenuItem = {
  label: string;
  hint: string;
  run: () => void;
};

export function BlockEditor({ document, onChange, readOnly = false, onUploadImage, onImportRemoteImage }: {
  document: DoramiDocument;
  onChange: (document: DoramiDocument) => void;
  readOnly?: boolean;
  onUploadImage?: (file: File) => Promise<{ mediaId: string; src: string }>;
  onImportRemoteImage?: (url:string)=>Promise<{mediaId:string;src:string}>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const uploadRef = useRef(onUploadImage);
  uploadRef.current = onUploadImage;
  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Underline, Highlight.configure({ multicolor: false }),
      DoramiImage.configure({ allowBase64: false }),
      TaskList, TaskItem.configure({ nested: true }), TableKit, Callout, DetailsSummary, DetailsContent, Details,
    ],
    content: document.content,
    editorProps: {
      attributes: { class: 'dorami-editor', 'aria-label': '글 본문' },
      handleDOMEvents: {
        compositionstart: () => { setComposing(true); return false; },
        compositionend: (view) => {
          setComposing(false);
          window.setTimeout(() => {
            onChange({ schemaVersion: 1, content: view.state.doc.toJSON() as JsonNode });
          }, 0);
          return false;
        },
      },
      handleKeyDown: (_view, event) => {
        if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
          window.setTimeout(() => setMenuOpen(true), 0);
        }
        if (event.key === 'Escape') setMenuOpen(false);
        return false;
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith('image/'));
        if (!file || !uploadRef.current) return false;
        event.preventDefault(); void uploadAndInsert(file); return true;
      },
      handleDrop: (_view, event) => {
        const file = Array.from(event.dataTransfer?.files ?? []).find((item) => item.type.startsWith('image/'));
        if (!file || !uploadRef.current) return false;
        event.preventDefault(); void uploadAndInsert(file); return true;
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      if (!composing && !(activeEditor.view as unknown as { composing?: boolean }).composing) {
        emit(activeEditor.getJSON() as JsonNode);
      }
    },
  });
  const emit = useCallback((content: JsonNode) => {
    onChange({ schemaVersion: 1, content });
  }, [onChange]);

  async function uploadAndInsert(file: File) {
    if (!uploadRef.current || !editor) return;
    setImageError(null);
    try {
      const media = await uploadRef.current(file);
      editor.chain().focus().setImage({ src: media.src, alt: file.name, mediaId: media.mediaId } as never).run();
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    }
  }
  async function importRemote(){if(!onImportRemoteImage||!editor)return;const url=window.prompt('가져올 HTTPS 이미지 주소');if(!url)return;setImageError(null);try{const media=await onImportRemoteImage(url);editor.chain().focus().setImage({src:media.src,alt:'',mediaId:media.mediaId}as never).run();}catch(error){setImageError(error instanceof Error?error.message:'외부 이미지 가져오기에 실패했습니다.');}}
  function editImage(){if(!editor||!editor.isActive('image'))return;const attrs=editor.getAttributes('image');const alt=window.prompt('대체 텍스트',attrs.alt??'');if(alt===null)return;const caption=window.prompt('캡션',attrs.caption??'');if(caption===null)return;const width=window.prompt('너비 (예: 640px, 80%)',attrs.width??'');if(width===null)return;editor.chain().focus().updateAttributes('image',{alt,caption,width:width||null}).run();}

  useEffect(() => {
    if (!editor || editor.isFocused) return;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(document.content)) {
      editor.commands.setContent(document.content, { emitUpdate: false });
    }
  }, [document, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  const removeSlash = useCallback(() => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1), from);
    if (textBefore === '/') editor.commands.deleteRange({ from: from - 1, to: from });
  }, [editor]);

  const runMenu = useCallback((command: () => void) => {
    removeSlash(); command(); setMenuOpen(false); editor?.commands.focus();
  }, [editor, removeSlash]);

  const menu = useMemo<MenuItem[]>(() => editor ? [
    { label:'텍스트', hint:'일반 문단', run:()=>runMenu(()=>editor.chain().focus().setParagraph().run()) },
    { label:'제목 1', hint:'큰 구역 제목', run:()=>runMenu(()=>editor.chain().focus().toggleHeading({ level:1 }).run()) },
    { label:'제목 2', hint:'중간 제목', run:()=>runMenu(()=>editor.chain().focus().toggleHeading({ level:2 }).run()) },
    { label:'글머리 목록', hint:'순서 없는 목록', run:()=>runMenu(()=>editor.chain().focus().toggleBulletList().run()) },
    { label:'번호 목록', hint:'순서 있는 목록', run:()=>runMenu(()=>editor.chain().focus().toggleOrderedList().run()) },
    { label:'체크 목록', hint:'할 일 목록', run:()=>runMenu(()=>editor.chain().focus().toggleTaskList().run()) },
    { label:'인용', hint:'인용문', run:()=>runMenu(()=>editor.chain().focus().toggleBlockquote().run()) },
    { label:'콜아웃', hint:'강조 상자', run:()=>runMenu(()=>editor.chain().focus().insertContent({type:'callout',content:[{type:'paragraph'}]}).run()) },
    { label:'토글', hint:'접고 펼치는 내용', run:()=>runMenu(()=>editor.chain().focus().insertContent({type:'details',content:[{type:'detailsSummary',content:[{type:'text',text:'자세히 보기'}]},{type:'detailsContent',content:[{type:'paragraph'}]}]}).run()) },
    { label:'코드 블록', hint:'기술 예제', run:()=>runMenu(()=>editor.chain().focus().toggleCodeBlock().run()) },
    { label:'구분선', hint:'내용 구분', run:()=>runMenu(()=>editor.chain().focus().setHorizontalRule().run()) },
  ] : [], [editor, runMenu]);

  function moveBlock(direction: -1 | 1) {
    if (!editor) return;
    const json = editor.getJSON();
    const content = [...(json.content ?? [])];
    const { $from } = editor.state.selection;
    const currentIndex = $from.index(0);
    const target = currentIndex + direction;
    if (target < 0 || target >= content.length) return;
    [content[currentIndex], content[target]] = [content[target], content[currentIndex]];
    editor.commands.setContent({ ...json, content }, { emitUpdate: true });
    editor.commands.focus(direction < 0 ? 'start' : 'end');
  }
  function duplicateBlock() {
    if (!editor) return;
    const json = editor.getJSON(); const content = [...(json.content ?? [])];
    const index = editor.state.selection.$from.index(0); const node = content[index]; if (!node) return;
    content.splice(index + 1, 0, JSON.parse(JSON.stringify(node)));
    editor.commands.setContent({ ...json, content }, { emitUpdate: true });
  }
  function deleteBlock() {
    if (!editor) return;
    const json = editor.getJSON(); const content = [...(json.content ?? [])];
    const index = editor.state.selection.$from.index(0);
    content.splice(index, 1); if (!content.length) content.push({ type:'paragraph' } as never);
    editor.commands.setContent({ ...json, content }, { emitUpdate: true });
  }
  function editLink() {
    if (!editor) return;
    const current = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt('HTTPS 링크 주소', current ?? 'https://');
    if (href === null) return;
    if (!href.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else if (/^https?:\/\//i.test(href)) editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    else setImageError('링크는 http:// 또는 https:// 주소만 사용할 수 있습니다.');
  }

  if (!editor) return <div className="editor-loading">편집기를 불러오는 중…</div>;
  return (
    <div className="block-editor">
      {!readOnly && (
        <div className="editor-toolbar" role="toolbar" aria-label="텍스트 서식">
          <button type="button" onClick={()=>editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>실행 취소</button>
          <button type="button" onClick={()=>editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>다시 실행</button>
          <span className="toolbar-divider" />
          <button type="button" className={editor.isActive('bold')?'is-active':''} onClick={()=>editor.chain().focus().toggleBold().run()} aria-pressed={editor.isActive('bold')}>굵게</button>
          <button type="button" className={editor.isActive('italic')?'is-active':''} onClick={()=>editor.chain().focus().toggleItalic().run()} aria-pressed={editor.isActive('italic')}>기울임</button>
          <button type="button" className={editor.isActive('underline')?'is-active':''} onClick={()=>editor.chain().focus().toggleUnderline().run()} aria-pressed={editor.isActive('underline')}>밑줄</button>
          <button type="button" className={editor.isActive('code')?'is-active':''} onClick={()=>editor.chain().focus().toggleCode().run()} aria-pressed={editor.isActive('code')}>코드</button>
          <button type="button" className={editor.isActive('link')?'is-active':''} onClick={editLink} aria-pressed={editor.isActive('link')}>링크</button>
          <span className="toolbar-divider" />
          <button type="button" onClick={()=>moveBlock(-1)} title="현재 블록을 위로 이동 (Alt+위)">↑ 블록</button>
          <button type="button" onClick={()=>moveBlock(1)} title="현재 블록을 아래로 이동 (Alt+아래)">↓ 블록</button>
          <button type="button" onClick={duplicateBlock}>복제</button>
          <button type="button" onClick={deleteBlock}>삭제</button>
          <button type="button" onClick={()=>setMenuOpen((value)=>!value)} aria-expanded={menuOpen}>＋ 블록</button>
          {onUploadImage && <><input ref={imageInput} hidden type="file" accept="image/*" onChange={(event)=>{const file=event.target.files?.[0];if(file)void uploadAndInsert(file);event.target.value='';}}/><button type="button" onClick={()=>imageInput.current?.click()}>이미지</button></>}
          {onImportRemoteImage&&<button type="button" onClick={()=>void importRemote()}>외부 이미지</button>}
          {editor.isActive('image')&&<><button type="button" onClick={editImage}>이미지 정보</button><button type="button" onClick={()=>editor.chain().focus().updateAttributes('image',{alignment:'left'}).run()}>왼쪽</button><button type="button" onClick={()=>editor.chain().focus().updateAttributes('image',{alignment:'center'}).run()}>가운데</button><button type="button" onClick={()=>editor.chain().focus().updateAttributes('image',{alignment:'right'}).run()}>오른쪽</button></>}
          <button type="button" onClick={()=>editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run()}>표</button>
          {editor.isActive('table') && <><button type="button" onClick={()=>editor.chain().focus().addRowAfter().run()}>행 추가</button><button type="button" onClick={()=>editor.chain().focus().deleteRow().run()}>행 삭제</button><button type="button" onClick={()=>editor.chain().focus().addColumnAfter().run()}>열 추가</button><button type="button" onClick={()=>editor.chain().focus().deleteColumn().run()}>열 삭제</button><button type="button" onClick={()=>editor.chain().focus().toggleHeaderRow().run()}>헤더 전환</button><button type="button" onClick={()=>editor.chain().focus().deleteTable().run()}>표 삭제</button></>}
          {editor.isActive('codeBlock')&&<select aria-label="코드 언어" value={editor.getAttributes('codeBlock').language??''} onChange={(event)=>editor.chain().focus().updateAttributes('codeBlock',{language:event.target.value||null}).run()}><option value="">일반</option><option value="bash">Bash</option><option value="python">Python</option><option value="javascript">JavaScript</option><option value="typescript">TypeScript</option><option value="html">HTML</option><option value="css">CSS</option><option value="sql">SQL</option><option value="json">JSON</option></select>}
        </div>
      )}
      <EditorContent editor={editor} />
      {menuOpen && !readOnly && (
        <div className="slash-menu" role="menu" aria-label="블록 추가">
          {menu.map((item)=><button key={item.label} type="button" role="menuitem" onClick={item.run}><strong>{item.label}</strong><span>{item.hint}</span></button>)}
        </div>
      )}
      {!readOnly && <p className="editor-hint"><kbd>/</kbd>로 블록을 추가하고, 도구 모음의 블록 이동으로 키보드에서도 순서를 바꿀 수 있습니다.</p>}
      {imageError && <p className="form-error" role="alert">{imageError}</p>}
    </div>
  );
}
