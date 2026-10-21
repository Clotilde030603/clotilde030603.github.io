import type { SaveState } from '../../lib/admin/types';
const labels: Record<SaveState, string> = { clean:'저장됨', changed:'변경됨', saving:'저장 중', saved:'저장 완료', offline:'연결 끊김', failed:'저장 실패', conflict:'충돌 감지' };
export function SaveStatus({ state }: { state: SaveState }) {
  return <span className={"save-status save-status--" + state} role="status"><span aria-hidden="true" className="save-status__dot" />{labels[state]}</span>;
}
