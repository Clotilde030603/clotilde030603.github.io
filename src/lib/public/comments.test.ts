import { describe, expect, it } from 'vitest';
import { buildCommentTree, formatCommentDate } from './comments';

describe('public comment normalization', () => {
  it('accepts backend snake_case fields and nests flat replies', () => {
    const comments = buildCommentTree([
      {
        id: 'parent',
        author_name: 'Dorami reader',
        body: '첫 댓글',
        created_at: '2026-10-21T00:00:00Z',
      },
      {
        id: 'reply',
        nickname: '답글 작성자',
        body: '답글',
        createdAt: '2026-10-21T01:00:00Z',
        parent_id: 'parent',
      },
    ]);

    expect(comments).toHaveLength(1);
    expect(comments[0].nickname).toBe('Dorami reader');
    expect(comments[0].createdAt).toBe('2026-10-21T00:00:00Z');
    expect(comments[0].replies[0].id).toBe('reply');
  });

  it('uses a safe label for invalid dates', () => {
    expect(formatCommentDate('not-a-date')).toBe('날짜 정보 없음');
    expect(formatCommentDate(null)).toBe('날짜 정보 없음');
  });
});
