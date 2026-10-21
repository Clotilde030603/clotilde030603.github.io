export type RawPublicComment = {
  id: string;
  nickname?: string;
  author_name?: string;
  body?: string;
  createdAt?: string;
  created_at?: string;
  parentId?: string | null;
  parent_id?: string | null;
  replies?: RawPublicComment[];
};

export type PublicCommentView = {
  id: string;
  nickname: string;
  body: string;
  createdAt: string | null;
  parentId: string | null;
  replies: PublicCommentView[];
};

export function buildCommentTree(rawComments: RawPublicComment[]): PublicCommentView[] {
  const flattened: PublicCommentView[] = [];
  const collect = (raw: RawPublicComment, inheritedParentId: string | null = null) => {
    const comment: PublicCommentView = {
      id: String(raw.id),
      nickname: raw.nickname ?? raw.author_name ?? '방문자',
      body: raw.body ?? '',
      createdAt: raw.createdAt ?? raw.created_at ?? null,
      parentId: raw.parentId ?? raw.parent_id ?? inheritedParentId,
      replies: [],
    };
    flattened.push(comment);
    for (const reply of raw.replies ?? []) collect(reply, comment.id);
  };
  for (const comment of rawComments) collect(comment);

  const byId = new Map(flattened.map((comment) => [comment.id, comment]));
  const roots: PublicCommentView[] = [];
  for (const comment of flattened) {
    const parent = comment.parentId ? byId.get(comment.parentId) : undefined;
    if (parent && parent.id !== comment.id) parent.replies.push(comment);
    else roots.push(comment);
  }
  return roots;
}

export function formatCommentDate(value: string | null): string {
  if (!value) return '날짜 정보 없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '날짜 정보 없음';
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeZone: 'Asia/Seoul',
  }).format(date);
}
