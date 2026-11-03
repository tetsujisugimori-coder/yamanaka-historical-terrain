import {createHash} from 'node:crypto';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export const canonicalBytes=(file,bytes)=>/\.(?:js|mjs|cjs|py|ps1|json|md|html|css|xml|ya?ml|txt)$/.test(file)?Buffer.from(bytes.toString('utf8').replaceAll('\r\n','\n')):bytes;
export const canonicalSha256=(file,bytes)=>sha256(canonicalBytes(file,bytes));
export const normalization='UTF-8 CRLF to LF only, matching repository .gitattributes; raw hashes at execution are retained separately. Binary bytes are unchanged.';
