export function poseAt(t,d){
 const smooth=q=>q*q*(3-2*q),clamp=q=>Math.max(0,Math.min(1,q));
 if(t<d.hopsEnd){
  const h=Math.min(2,Math.floor(t/d.hopDuration)),q=(t-h*d.hopDuration)/d.hopDuration;
  const starts=[0,140,240],ends=[140,240,320],u=clamp((q-.12)/.77);
  const k=Math.max(0,1-Math.abs(q-.93)/.07)*.035;
  return {frame:Math.min(7,Math.floor(q*8)),x:starts[h]+(ends[h]-starts[h])*smooth(u),y:-34*Math.sin(Math.PI*clamp((q-.18)/.57)),sx:d.scale*(1+k),sy:d.scale*(1-k)};
 }
 let u=t-d.hopsEnd;
 for(const [frame,duration] of d.beats){
  if(u<duration){const k=frame===10?Math.sin(Math.PI*u/duration)*.035:0;return {frame,x:320,y:0,sx:d.scale*(1+k),sy:d.scale*(1-k)};}
  u-=duration;
 }
 return {frame:d.work[Math.floor(u/d.workStep)%d.work.length],x:320,y:0,sx:d.scale,sy:d.scale};
}
export function paint(ctx,images,d,t,compact=false){
 const st=poseAt(t,d),m=d.frames[st.frame];
 if(compact)st.x=-110+st.x*.84375;
 const spriteSize=280*st.sx;
 const imageLeft=st.x-m.anchorX*st.sx;
 const enteringAlpha=t<d.hopsEnd?Math.max(0,Math.min(1,imageLeft/(spriteSize*.13))):1;
 ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
 ctx.save();ctx.globalAlpha=enteringAlpha;ctx.fillStyle='rgba(67,91,46,.063)';ctx.beginPath();ctx.ellipse(st.x,d.ground+5,47*(1+st.y/110),2.5,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(images[st.frame],imageLeft,d.ground+st.y-m.anchorY*st.sy,spriteSize,spriteSize);ctx.restore();
}
export async function createPlayer(canvas,{data,urls,compact=false,autoplay=true}={}){
 const images=await Promise.all(urls.map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>im.naturalWidth===280&&im.naturalHeight===280?resolve(im):reject(new Error('이미지 크기가 올바르지 않습니다.'));im.onerror=()=>reject(new Error('이미지를 불러오지 못했습니다.'));im.src=src;})));
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas를 사용할 수 없습니다.');
 canvas.width=compact?320:data.width;canvas.height=data.height;
 let elapsed=0,start=performance.now(),playing=autoplay,raf=0,disposed=false;
 const now=()=>elapsed+(playing?(performance.now()-start)/1000:0);
 const tick=()=>{if(disposed)return;paint(ctx,images,data,now(),compact);if(playing)raf=requestAnimationFrame(tick);};
 tick();
 return {
  get currentTime(){return now();},get paused(){return !playing;},
  pause(){if(!playing)return;elapsed=now();playing=false;cancelAnimationFrame(raf);paint(ctx,images,data,elapsed,compact);},
  play(){if(playing||disposed)return;start=performance.now();playing=true;tick();},
  seek(t){elapsed=Math.max(0,Number(t)||0);start=performance.now();paint(ctx,images,data,elapsed,compact);},
  replay(){this.seek(0);this.play();},
  destroy(){disposed=true;cancelAnimationFrame(raf);playing=false;}
 };
}
