import fs from 'node:fs';import crypto from 'node:crypto';
const data=JSON.parse(fs.readFileSync('research/stage3b/preserved-inputs.json'));
for(const f of data.files){const actual=crypto.createHash('sha256').update(fs.readFileSync(f.path)).digest('hex');if(actual!==f.sha256)throw Error('Protected input changed: '+f.path);}
console.log(JSON.stringify({base:data.base,preservedFiles:data.files.length,allUnchanged:true}));
