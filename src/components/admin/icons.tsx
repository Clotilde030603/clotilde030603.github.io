import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;
export function Icon({ children, ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>{children}</svg>;
}
export const PlusIcon = () => <Icon><path d="M12 5v14M5 12h14" /></Icon>;
export const FileIcon = () => <Icon><path d="M7 3.5h7l3 3V20H7zM14 3.5V7h3M9.5 11h5M9.5 14.5h5" /></Icon>;
export const FolderIcon = () => <Icon><path d="M3.5 7.5h6l2-2h9v14h-17z" /></Icon>;
export const ImageIcon = () => <Icon><rect x="3.5" y="4" width="17" height="16" rx="1" /><circle cx="8" cy="9" r="1.5" /><path d="m5.5 17 4-4 3 3 2.5-2.5 3.5 3.5" /></Icon>;
export const CommentIcon = () => <Icon><path d="M4 5h16v11H9l-4 3v-3H4z" /></Icon>;
export const ChartIcon = () => <Icon><path d="M4 20V4M4 20h16M8 17v-5M12 17V8M16 17v-9M20 17V5" /></Icon>;
export const TrashIcon = () => <Icon><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7" /></Icon>;
export const DownloadIcon = () => <Icon><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" /></Icon>;
export const UploadIcon = () => <Icon><path d="M12 17V5m0 0 4 4m-4-4L8 9M5 20h14" /></Icon>;
export const TemplateIcon = () => <Icon><rect x="4" y="3.5" width="16" height="17" rx="1" /><path d="M8 8h8M8 12h8M8 16h5" /></Icon>;
