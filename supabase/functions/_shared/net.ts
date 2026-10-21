import { HttpError } from './http.ts';

const defaultTrustedHosts=['blog.kakaocdn.net','t1.daumcdn.net','tistory1.daumcdn.net','img1.daumcdn.net','k.kakaocdn.net'];

function trustedHosts():Set<string>{
  const configured=(Deno.env.get('REMOTE_IMAGE_TRUSTED_HOSTS')??'').split(',').map((value)=>value.trim().toLowerCase()).filter(Boolean);
  return new Set([...defaultTrustedHosts,...configured]);
}

function publicIpv4(value: string): boolean {
  const parts=value.split('.').map(Number); if(parts.length!==4||parts.some((part)=>!Number.isInteger(part)||part<0||part>255)) return false;
  const [a,b]=parts;
  if(a===0||a===10||a===127||a>=224) return false;
  if(a===100&&b>=64&&b<=127) return false;
  if(a===169&&b===254) return false;
  if(a===172&&b>=16&&b<=31) return false;
  if(a===192&&(b===0||b===168)) return false;
  if(a===198&&(b===18||b===19||b===51)) return false;
  if(a===203&&b===0) return false;
  return true;
}

export function isPublicAddress(value:string):boolean {
  const address=value.toLowerCase().replace(/^\[|\]$/g,'');
  if(/^\d+\.\d+\.\d+\.\d+$/.test(address)) return publicIpv4(address);
  if(!address.includes(':')) return false;
  if(address==='::'||address==='::1'||address.startsWith('fc')||address.startsWith('fd')||address.startsWith('fe8')||address.startsWith('fe9')||address.startsWith('fea')||address.startsWith('feb')||address.startsWith('ff')) return false;
  if(address.startsWith('::ffff:')) return publicIpv4(address.slice(7));
  if(address.startsWith('2001:db8:')) return false;
  return address.startsWith('2')||address.startsWith('3');
}

export async function validateRemoteHttps(raw:string):Promise<URL> {
  let url:URL; try { url=new URL(raw); } catch { throw new HttpError(400,'invalid remote URL'); }
  if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')) throw new HttpError(400,'remote image URL must use HTTPS port 443 without credentials');
  const host=url.hostname.toLowerCase().replace(/^\[|\]$/g,'');
  if(!trustedHosts().has(host)) throw new HttpError(400,'remote image host is not in the trusted allowlist');
  if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')) throw new HttpError(400,'private network targets are not allowed');
  let addresses:string[]=[];
  if(/^\d+\.\d+\.\d+\.\d+$/.test(host)||host.includes(':')) addresses=[host];
  else {
    const results=await Promise.allSettled([Deno.resolveDns(host,'A'),Deno.resolveDns(host,'AAAA')]);
    for(const result of results) if(result.status==='fulfilled') addresses.push(...result.value);
  }
  if(!addresses.length||addresses.some((address)=>!isPublicAddress(address))) throw new HttpError(400,'remote host does not resolve exclusively to public addresses');
  return url;
}

export function validImageMagic(mime:string,bytes:Uint8Array):boolean {
  if(mime==='image/jpeg') return bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  if(mime==='image/png') return bytes.slice(0,8).every((value,index)=>value===[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][index]);
  const text=new TextDecoder().decode(bytes.slice(0,12));
  if(mime==='image/gif') return text.startsWith('GIF87a')||text.startsWith('GIF89a');
  if(mime==='image/webp') return text.startsWith('RIFF')&&text.slice(8,12)==='WEBP';
  return false;
}
