import { describe, expect, it } from 'vitest';
import type { Category } from '../types';
import { buildCategoryTree, containsCategory } from './category-tree';

const category = (id: string, parentId: string | null, position: number): Category => ({
  id,
  parentId,
  position,
  name: id,
  slug: id,
});

describe('buildCategoryTree', () => {
  it('keeps categories reachable at arbitrary depth and sorted', () => {
    const tree = buildCategoryTree([
      category('grandchild', 'child', 0),
      category('second-root', null, 2),
      category('root', null, 1),
      category('child', 'root', 0),
      category('great-grandchild', 'grandchild', 0),
    ]);

    expect(tree.map((node) => node.id)).toEqual(['root', 'second-root']);
    expect(tree[0].children[0].children[0].children[0].id).toBe('great-grandchild');
    expect(containsCategory(tree[0], 'great-grandchild')).toBe(true);
  });

  it('keeps invalid cycles reachable as roots', () => {
    const tree = buildCategoryTree([category('a', 'b', 0), category('b', 'a', 1)]);
    expect(tree.map((node) => node.id)).toEqual(['a', 'b']);
  });
});
