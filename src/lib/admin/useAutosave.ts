import { useCallback, useEffect, useRef, useState } from 'react';
import type { DraftRecord, EditableDraft, SaveState } from './types';
import { messageFromError, VersionConflictError } from './errors';

type Options={draft:EditableDraft|null;dirtyToken:number;enabled:boolean;save:(draft:EditableDraft)=>Promise<DraftRecord>;onSaved:(draft:DraftRecord)=>void};
export function useAutosave({draft,dirtyToken,enabled,save,onSaved}:Options){
  const [state,setState]=useState<SaveState>('clean');const [message,setMessage]=useState<string|null>(null);
  const latestDraft=useRef(draft);const latestToken=useRef(dirtyToken);const lastSavedToken=useRef(0);const saving=useRef(false);const retryTimer=useRef<number|null>(null);
  const enabledRef=useRef(enabled);const saveRef=useRef(save);const onSavedRef=useRef(onSaved);
  latestDraft.current=draft;latestToken.current=dirtyToken;enabledRef.current=enabled;saveRef.current=save;onSavedRef.current=onSaved;

  const runSave=useCallback(async()=>{
    const value=latestDraft.current;const tokenAtStart=latestToken.current;
    if(!value||!enabledRef.current||saving.current)return false;
    if(!navigator.onLine){setState('offline');setMessage('연결이 끊겼습니다. 내용은 현재 화면에 유지되며 재연결 후 다시 저장합니다.');return false;}
    saving.current=true;setState('saving');setMessage(null);
    try{
      const stored=await saveRef.current(value);onSavedRef.current(stored);lastSavedToken.current=tokenAtStart;
      const hasNewer=latestToken.current>tokenAtStart;setState(hasNewer?'changed':'saved');
      if(hasNewer){if(retryTimer.current)window.clearTimeout(retryTimer.current);retryTimer.current=window.setTimeout(()=>void runSave(),1500);}
      return true;
    }catch(error){setState(error instanceof VersionConflictError?'conflict':'failed');setMessage(messageFromError(error));return false;}
    finally{saving.current=false;}
  },[]);

  useEffect(()=>{
    if(!draft||!enabled||dirtyToken===0||dirtyToken<=lastSavedToken.current)return;
    setState('changed');const timer=window.setTimeout(()=>void runSave(),1500);return()=>window.clearTimeout(timer);
  },[dirtyToken,enabled,runSave]);
  useEffect(()=>()=>{if(retryTimer.current)window.clearTimeout(retryTimer.current);},[]);
  useEffect(()=>{function online(){if(state==='offline'&&latestToken.current>lastSavedToken.current)void runSave();}window.addEventListener('online',online);return()=>window.removeEventListener('online',online);},[runSave,state]);
  useEffect(()=>{function beforeUnload(event:BeforeUnloadEvent){if(['changed','saving','failed','offline'].includes(state))event.preventDefault();}window.addEventListener('beforeunload',beforeUnload);return()=>window.removeEventListener('beforeunload',beforeUnload);},[state]);
  return{state,message,saveNow:runSave};
}
