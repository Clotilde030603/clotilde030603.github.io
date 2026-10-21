import type{DoramiDocument}from'../types';
export type AboutDraft={id:number;document:DoramiDocument;version:number;updated_at:string};
export function mergeConfirmedAbout(current:AboutDraft,saved:AboutDraft,tokenAtStart:number,latestToken:number):AboutDraft{return latestToken===tokenAtStart?saved:{...current,version:saved.version,updated_at:saved.updated_at};}
