import workbook from './workbook.json';
export type RecordRow = {id:string;values:string[];sourceRow?:number};
// Same storage model as Admin_Masters (provider.ts): workbook rows ship with the app;
// edits save to this device under a key scoped to the exact shipped workbook, so a
// workbook update reveals itself instead of hiding behind a stale saved table.
const revision=JSON.stringify(workbook);
let hash=2166136261;
for(let i=0;i<revision.length;i++)hash=Math.imul(hash^revision.charCodeAt(i),16777619);
const KEY=`cam-masters-v1-${(hash>>>0).toString(16)}`;
function tableMeta(name:string){return workbook.sheets.find(s=>s.name===name);}
export function loadRows(name:string):RecordRow[]{
 const sheet=tableMeta(name)!;
 if(sheet.readOnly)return structuredClone(sheet.rows) as RecordRow[];
 try {
  const saved=JSON.parse(localStorage.getItem(KEY)||'{}')[name];
  if(Array.isArray(saved)&&saved.every((r:any)=>typeof r.id==='string'&&Array.isArray(r.values)&&r.values.length===sheet.headers.length&&r.values.every((v:any)=>typeof v==='string')))return saved;
 }catch{}
 return structuredClone(sheet.rows) as RecordRow[];
}
export function saveRows(name:string,rows:RecordRow[]){
 if(tableMeta(name)?.readOnly)throw Error('This table is read-only for FDE.');
 let saved:any={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
 localStorage.setItem(KEY,JSON.stringify({...saved,[name]:rows}));
}
