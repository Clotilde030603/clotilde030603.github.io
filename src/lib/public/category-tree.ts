import type { Category } from '../types';

export type CategoryTreeNode = Category & { children: CategoryTreeNode[] };

export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const sourceById = new Map(categories.map((category) => [category.id, category]));
  const nodeById = new Map<string, CategoryTreeNode>(
    categories.map((category) => [category.id, { ...category, children: [] }]),
  );
  const roots: CategoryTreeNode[] = [];

  const hasAncestor = (category: Category, ancestorId: string): boolean => {
    const visited = new Set<string>();
    let parentId = category.parentId;
    while (parentId && !visited.has(parentId)) {
      if (parentId === ancestorId) return true;
      visited.add(parentId);
      parentId = sourceById.get(parentId)?.parentId ?? null;
    }
    return false;
  };

  for (const category of categories) {
    const node = nodeById.get(category.id)!;
    const parent = category.parentId ? nodeById.get(category.parentId) : undefined;
    if (!parent || category.parentId === category.id || hasAncestor(category, category.id)) {
      roots.push(node);
    } else {
      parent.children.push(node);
    }
  }

  const sort = (nodes: CategoryTreeNode[]) => {
    nodes.sort((left, right) => left.position - right.position || left.name.localeCompare(right.name, 'ko'));
    for (const node of nodes) sort(node.children);
  };
  sort(roots);
  return roots;
}

export function containsCategory(node: CategoryTreeNode, categoryId: string | null): boolean {
  return node.id === categoryId || node.children.some((child) => containsCategory(child, categoryId));
}
