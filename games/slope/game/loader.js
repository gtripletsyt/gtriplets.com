'use strict';
const statusLine=document.getElementById('status'),canvas=document.getElementById('unity-canvas');
function log(...parts){const text=parts.join(' ');const el=document.getElementById('log');el.textContent=(el.textContent+'\n'+text).slice(-18000);console.log(...parts);}
function unpack(buffer){
  const b=new Uint8Array(buffer),d=new DataView(buffer),decoder=new TextDecoder();
  if(decoder.decode(b.subarray(0,16))!=='UnityWebData1.0\0')throw new Error('Unexpected game data format.');
  const end=d.getUint32(16,true);let p=20;const files=[];
  while(p<end){const offset=d.getUint32(p,true),size=d.getUint32(p+4,true),length=d.getUint32(p+8,true);p+=12;if(p+length>end||offset+size>b.length)throw new Error('Invalid game archive.');const name=decoder.decode(b.subarray(p,p+length));p+=length;files.push({name,bytes:b.subarray(offset,offset+size)});}
  return files;
}
window.UnityLoader={SystemInfo:{browser:'Chrome',browserVersion:'120',os:navigator.platform||'Unknown',osVersion:'',gpu:'WebGL',hasFullscreen:!!document.fullscreenEnabled,hasCursorLock:!!canvas.requestPointerLock,hasWebGL:1,width:screen.width,height:screen.height,language:navigator.language||'en-US'}};
document.getElementById('start').onclick=async()=>{
  const button=document.getElementById('start');button.disabled=true;statusLine.textContent='Loading game files…';
  try{
    const [code,data]=await Promise.all(['slope.wasm','slope.data'].map(async name=>{const r=await fetch(name);if(!r.ok)throw new Error('Missing '+name);return r.arrayBuffer();}));
    const files=unpack(data);
    const Module={canvas,wasmBinary:new Uint8Array(code),TOTAL_MEMORY:268435456,preRun:[],postRun:[],arguments:[],noExitRuntime:true,print:log,printErr:log,webglContextAttributes:{alpha:false,depth:true,stencil:false,antialias:false,preserveDrawingBuffer:false},unityFileSystemInit:()=>{},setStatus:message=>{if(message)statusLine.textContent=message;},onAbort:message=>{statusLine.textContent='Runtime error: '+message;}};
    Module.preRun.push(()=>{
      for(const f of files){const pieces=f.name.split('/'),name=pieces.pop(),dir='/'+pieces.join('/');if(pieces.length)Module.FS_createPath('/',pieces.join('/'),true,true);Module.FS_createDataFile(dir,name,f.bytes,true,true,true);}
    });
    Module.postRun.push(()=>{statusLine.textContent='Game loaded. Click Play in the game, then use the arrow keys.';button.hidden=true;window.SlopePractice=installSlopePractice(Module);installSlopeMods(Module);canvas.focus();});
    window.SlopeModule=Module;
    createSlopeRuntime(Module);
  }catch(e){statusLine.textContent='Could not start: '+e.message;log(e.stack||String(e));button.disabled=false;}
};
