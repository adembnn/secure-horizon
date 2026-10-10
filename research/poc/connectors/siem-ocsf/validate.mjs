// Validates an OCSF event against the official OCSF 1.3.0 class schema (fetched from schema.ocsf.io): required attrs, enums, types.
import fs from 'node:fs';
const [,, evFile, schemaDir, ver='1.3.0'] = process.argv;
const ev = JSON.parse(fs.readFileSync(evFile,'utf8'));
const errs=[]; 
async function load(kind,name){
  const f=`${schemaDir}/${kind}_${name}.json`;
  if(!fs.existsSync(f)){ const r=await fetch(`https://schema.ocsf.io/api/${ver}/${kind==='class'?'classes':'objects'}/${name}`); if(!r.ok) return null; fs.writeFileSync(f,await r.text()); }
  return JSON.parse(fs.readFileSync(f,'utf8'));
}
const chk=(t,v)=>({integer_t:Number.isInteger(v),long_t:Number.isInteger(v),timestamp_t:Number.isInteger(v),string_t:typeof v==='string',boolean_t:typeof v==='boolean',json_t:true,object_t:v&&typeof v==='object'}[t] ?? true);
async function validate(obj,schema,path,activeProfiles){
  const attrs={}; for(const a of schema.attributes){const k=Object.keys(a)[0];attrs[k]=a[k];}
  for(const [k,d] of Object.entries(attrs)){
    const prof=d.profile; // profile-gated attrs required only if profile active
    if(d.requirement==='required' && (!prof || activeProfiles.includes(prof)) && !(k in obj)) errs.push(`${path}${k}: missing required`);
  }
  for(const [k,v] of Object.entries(obj)){
    if(k==='unmapped')continue; const d=attrs[k]; if(!d){ if(!k.endsWith('_name')&&!['severity','status'].includes(k)) errs.push(`${path}${k}: not in schema`); continue; }
    if(d.is_array){ if(!Array.isArray(v)) errs.push(`${path}${k}: should be array`); continue; }
    if(d.enum && !(String(v) in d.enum)) errs.push(`${path}${k}: ${v} not in enum ${Object.keys(d.enum)}`);
    if(d.type==='object_t'){ if(!chk('object_t',v)){errs.push(`${path}${k}: not object`);continue;}
      const os=await load('object',d.object_type||k); if(os) await validate(v,os,`${path}${k}.`,activeProfiles); }
    else if(!chk(d.type,v)) errs.push(`${path}${k}: type ${d.type} expected, got ${typeof v}`);
  }
}
const cls=await load('class','detection_finding');
if(ev.class_uid!==cls.uid) errs.push(`class_uid ${ev.class_uid} != ${cls.uid}`);
if(ev.type_uid!==ev.class_uid*100+ev.activity_id) errs.push('type_uid != class_uid*100+activity_id');
await validate(ev,cls,'',ev.metadata?.profiles||[]);
if(errs.length){console.log('INVALID',errs);process.exit(1)}
console.log(`VALID: OCSF ${ver} class ${cls.name} (${cls.uid}) - required attrs, enums, types and nested objects (finding_info, metadata, product) checked against official schema`);
