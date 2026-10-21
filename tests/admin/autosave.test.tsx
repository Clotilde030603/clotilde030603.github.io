// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAutosave } from '../../src/lib/admin/useAutosave';
import { EMPTY_DOCUMENT, type DraftRecord, type EditableDraft } from '../../src/lib/admin/types';

const base:EditableDraft={post_id:'p1',title:'초안',summary:'',category_id:null,tags:[],document:EMPTY_DOCUMENT,cover_media_id:null,original_created_at:null,source_url:null,version:1,updated_at:'2026-10-21T00:00:00Z'};
afterEach(()=>{vi.useRealTimers();document.body.innerHTML='';});
describe('autosave scheduling',()=>{
  it('saves one edit once even when the confirmed server version updates draft state',async()=>{
    vi.useFakeTimers();Object.defineProperty(navigator,'onLine',{configurable:true,value:true});
    const save=vi.fn(async(value:EditableDraft)=>({...value,version:value.version+1,updated_at:'2026-10-21T00:00:02Z'} as DraftRecord));
    function Harness(){const[draft,setDraft]=useState(base);const[token,setToken]=useState(0);const result=useAutosave({draft,dirtyToken:token,enabled:true,save,onSaved:(stored)=>setDraft((current)=>({...current,version:stored.version,updated_at:stored.updated_at}))});return <><button id="edit" onClick={()=>{setDraft((current)=>({...current,title:'수정'}));setToken((value)=>value+1);}}>edit</button><output>{result.state}</output></>;}
    const root=createRoot(document.body.appendChild(document.createElement('div')));await act(async()=>root.render(<Harness/>));
    await act(async()=>{document.querySelector<HTMLButtonElement>('#edit')!.click();await vi.advanceTimersByTimeAsync(1600);});
    await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});
    expect(save).toHaveBeenCalledTimes(1);expect(document.querySelector('output')?.textContent).toBe('saved');root.unmount();
  });
});
