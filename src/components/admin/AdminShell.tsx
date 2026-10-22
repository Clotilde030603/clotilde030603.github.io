import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import type { AdminCategory, AdminSection } from '../../lib/admin/types';
import { ChartIcon, CommentIcon, DownloadIcon, FileIcon, FolderIcon, ImageIcon, PlusIcon, TemplateIcon, TrashIcon, UploadIcon } from './icons';
const items: Array<{ section: AdminSection; label: string; icon: ReactNode }> = [
  { section:'posts', label:'작성 중인 글', icon:<FileIcon /> }, { section:'categories', label:'카테고리', icon:<FolderIcon /> },
  { section:'about', label:'소개 관리', icon:<FileIcon /> },
  { section:'media', label:'미디어', icon:<ImageIcon /> }, { section:'templates', label:'템플릿', icon:<TemplateIcon /> },
  { section:'comments', label:'댓글 관리', icon:<CommentIcon /> }, { section:'analytics', label:'방문 통계', icon:<ChartIcon /> },
  { section:'deployments', label:'배포 상태', icon:<UploadIcon /> },
  { section:'trash', label:'휴지통', icon:<TrashIcon /> },
];
export function AdminShell({ section, user, categories, onNavigate, onNewPost, onSignOut, children }: {
  section: AdminSection; user: User; categories: AdminCategory[]; onNavigate:(section:AdminSection)=>void;
  onNewPost:()=>void; onSignOut:()=>void; children:ReactNode;
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="관리자 메뉴">
        <a className="admin-brand" href="/" aria-label="Dorami 공개 블로그로 이동"><img src="/dorami-cartoon/dorami-rabbit-face.png" alt="" /><span>Dorami</span></a>
        <button className="admin-new" type="button" onClick={onNewPost}><PlusIcon /> 새 글</button>
        <nav>{items.map((item)=><button key={item.section} type="button" className={section===item.section?'nav-item is-active':'nav-item'} onClick={()=>onNavigate(item.section)}>{item.icon}<span>{item.label}</span></button>)}</nav>
        <div className="category-tree"><p>글 분류</p>
          {categories.length===0?<span className="category-tree__empty">등록된 분류 없음</span>:categories.map((category)=><button key={category.id} type="button" onClick={()=>onNavigate('posts')}><span className="tree-stem" aria-hidden="true" />{category.name}</button>)}
        </div>
        <div className="admin-sidebar__lower">
          <button type="button" className="nav-item" onClick={()=>onNavigate('import')}><UploadIcon /><span>가져오기</span></button>
          <button type="button" className="nav-item" onClick={()=>onNavigate('backup')}><DownloadIcon /><span>백업</span></button>
        </div>
        <div className="admin-account"><span title={user.email}>{user.email}</span><button type="button" onClick={onSignOut}>로그아웃</button></div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
