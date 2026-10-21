import{describe,expect,it}from'vitest';import{reorderWithinGroup}from'../../src/lib/admin/reorder';
const rows=[{id:'a',group:'one'},{id:'b',group:'one'},{id:'c',group:'two'}];
describe('bounded drag reorder',()=>{it('returns the complete sibling order',()=>expect(reorderWithinGroup(rows,'b','a',(row)=>row.group)).toEqual(['b','a']));it('rejects cross-group drops',()=>expect(reorderWithinGroup(rows,'a','c',(row)=>row.group)).toBeNull());});
