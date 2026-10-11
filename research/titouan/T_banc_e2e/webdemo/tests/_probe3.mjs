import * as M from '../js/verdict_model.js';
import EX from '../js/exemples_public.js';
for (const e of EX){const v=M.check({...e.request,origin:e.origin},M.emptyLocal());const l=M.displayLevel(v).key; if(l==='unknown'||l==='attention')console.log(e.id,e.family,l,v.fiche,JSON.stringify(v.request?0:0),JSON.stringify(e.request).slice(0,300));}
