import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

// Operator backup utility: private records are read only in this process and
// written only as authenticated ciphertext. Never print response bodies.
const [envFile, schemaFile, directory] = process.argv.slice(2);
if (!envFile || !schemaFile || !directory || process.platform !== 'win32') throw new Error('Windows operator paths are required.');
const source = fs.readFileSync(envFile,'utf8');
function setting(name) {
  const match = source.match(new RegExp('^'+name+'=(.*)$','m'));
  return match?.[1].trim().replace(/^(['"])(.*)\1$/, '$2');
}
const base = setting('NEXT_PUBLIC_SUPABASE_URL');
const publicKey = setting('NEXT_PUBLIC_SUPABASE_ANON_KEY');
if (base !== 'https://hjttoxgryzyxhcdepgcg.supabase.co' || !publicKey) throw new Error('Expected Kamker public API configuration.');
const schema = JSON.parse(fs.readFileSync(schemaFile,'utf8'));
if (schema.tables.length !== 23) throw new Error('Review the backup table list before proceeding.');
const headers = { apikey:publicKey, Authorization:`Bearer ${publicKey}`, Prefer:'count=exact' };
const counts = {}, data = {}, startedAt = new Date().toISOString();
for (const table of schema.tables) {
  const name = table.name.replace(/^public\./,'');
  const primary = table.primary_keys?.[0];
  if (!/^[a-z_]+$/.test(name) || !/^[a-z_]+$/.test(primary)) throw new Error('Unsupported table identifier.');
  const rows = [];
  let total;
  for (let offset=0;;offset+=1000) {
    const r = await fetch(`${base}/rest/v1/${name}?select=*&order=${primary}.asc&offset=${offset}&limit=1000`,{headers,cache:'no-store'});
    if (!r.ok) throw new Error(`Backup read failed for ${name} (${r.status}); no record contents logged.`);
    const count = Number(r.headers.get('content-range')?.split('/')[1]);
    if (!Number.isSafeInteger(count)) throw new Error(`Missing exact count for ${name}.`);
    if (total !== undefined && total !== count) throw new Error(`Concurrent change in ${name}; retry backup.`);
    total = count;
    const page = await r.json();
    if (!Array.isArray(page)) throw new Error(`Invalid backup response for ${name}.`);
    rows.push(...page);
    if (rows.length >= total) break;
    if (!page.length) throw new Error(`Incomplete backup for ${name}.`);
  }
  if (rows.length !== total) throw new Error(`Incomplete backup count for ${name}.`);
  data[name] = rows;
  counts[name] = rows.length;
}
// Detect relationship inconsistencies and concurrent inserts/deletes across the
// paginated read. This is a logical application backup, not a pg_dump snapshot.
const relations = [...new Map(schema.tables.flatMap(t=>t.foreign_key_constraints??[]).map(f=>[f.name,f])).values()];
for (const relation of relations) {
  const parent = data[relation.target_table.replace(/^public\./,'')];
  const children = data[relation.source_table.replace(/^public\./,'')];
  if (!parent || !children) continue;
  const keys = new Set(parent.map(row=>JSON.stringify(relation.target_columns.map(c=>row[c]))));
  for (const row of children) {
    const values = relation.source_columns.map(c=>row[c]);
    if (values.every(v=>v!==null&&v!==undefined) && !keys.has(JSON.stringify(values))) throw new Error(`Relationship validation failed: ${relation.name}.`);
  }
}
for (const [name,count] of Object.entries(counts)) {
  const r = await fetch(`${base}/rest/v1/${name}?select=${schema.tables.find(t=>t.name==='public.'+name).primary_keys[0]}`,{method:'HEAD',headers,cache:'no-store'});
  if (!r.ok || Number(r.headers.get('content-range')?.split('/')[1]) !== count) throw new Error(`Concurrent change in ${name}; retry backup.`);
}
fs.mkdirSync(directory,{recursive:true});
function powershell(code,input='') {
  const r = spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',code],{input,encoding:'utf8',windowsHide:true});
  if(r.status!==0) throw new Error('Windows backup protection failed.');
  return r.stdout.trim();
}
const sid = powershell('[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value');
const acl = spawnSync('icacls.exe',[directory,'/inheritance:r','/grant:r',`*${sid}:(OI)(CI)F`],{windowsHide:true,stdio:'pipe'});
if(acl.status!==0) throw new Error('Could not restrict backup folder access.');
const key = crypto.randomBytes(32), iv = crypto.randomBytes(12);
const payload = Buffer.from(JSON.stringify({format:'kamker-application-tables-v1',startedAt,finishedAt:new Date().toISOString(),transactionalSnapshot:false,schema,counts,data}));
const hash = crypto.createHash('sha256').update(payload).digest('hex');
const cipher = crypto.createCipheriv('aes-256-gcm',key,iv);
const ciphertext = Buffer.concat([cipher.update(payload),cipher.final()]);
const tag = cipher.getAuthTag();
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const file = path.join(directory,`kamker-${stamp}.encrypted.json`);
const keyFile = file+'.windows-key';
const protectedKey = powershell('[void][System.Reflection.Assembly]::LoadWithPartialName("System.Security"); $b=[Convert]::FromBase64String([Console]::In.ReadToEnd()); [Convert]::ToBase64String([System.Security.Cryptography.ProtectedData]::Protect($b,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser))',key.toString('base64'));
fs.writeFileSync(keyFile,protectedKey,{flag:'wx'});
fs.writeFileSync(file,JSON.stringify({algorithm:'aes-256-gcm',iv:iv.toString('base64'),tag:tag.toString('base64'),ciphertext:ciphertext.toString('base64'),sha256:hash}),{flag:'wx'});
const recovered = Buffer.from(powershell('[void][System.Reflection.Assembly]::LoadWithPartialName("System.Security"); $b=[Convert]::FromBase64String([Console]::In.ReadToEnd()); [Convert]::ToBase64String([System.Security.Cryptography.ProtectedData]::Unprotect($b,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser))',fs.readFileSync(keyFile,'utf8')),'base64');
const saved = JSON.parse(fs.readFileSync(file,'utf8'));
const decipher = crypto.createDecipheriv('aes-256-gcm',recovered,Buffer.from(saved.iv,'base64'));
decipher.setAuthTag(Buffer.from(saved.tag,'base64'));
const restored = Buffer.concat([decipher.update(Buffer.from(saved.ciphertext,'base64')),decipher.final()]);
if(crypto.createHash('sha256').update(restored).digest('hex')!==hash) throw new Error('Backup verification failed.');
if(JSON.stringify(JSON.parse(restored.toString()).counts)!==JSON.stringify(counts)) throw new Error('Backup table verification failed.');
key.fill(0);recovered.fill(0);payload.fill(0);restored.fill(0);
console.log(JSON.stringify({backup:file,keyProtection:'Windows current-user DPAPI',tables:Object.keys(counts).length,records:Object.values(counts).reduce((a,b)=>a+b,0),relationshipChecks:relations.length,integrityVerified:true,transactionalSnapshot:false}));
