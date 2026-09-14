/* Profile for the uploaded Slope Unity 2017.4.0f1 build. No edits occur until a control is used. */
function installSlopePractice(Module){
  'use strict';
  if(globalThis.SlopePractice?.module===Module)return globalThis.SlopePractice;
  const expectedSetterText='UnityEngine.Time::set_timeScale';
  let host,root,timer,previous=1,held=null;
  function getBuffer(){return Module.wasmMemory?.buffer||Module.HEAPU8?.buffer||Module.buffer;}
  function ready(){
    const b=getBuffer();if(!b||b.byteLength<2080800)return false;
    const v=new Uint8Array(b,1345017,expectedSetterText.length);
    if(String.fromCharCode(...v)!==expectedSetterText)return false;
    const d=new DataView(b),manager=d.getUint32(1999036,true);
    return manager>0&&manager+232<b.byteLength&&typeof Module.dynCall_vf==='function'&&typeof Module.dynCall_f==='function';
  }
  function get(){if(!ready())throw new Error('Waiting for this Slope build to initialize.');return Module.dynCall_f(8);}
  function set(value){const n=Number(value);if(!Number.isFinite(n)||n<0||n>8)throw new Error('Choose a speed between 0 and 8.');if(!ready())throw new Error('This game build is not ready or does not match the profile.');Module.dynCall_vf(4,n);return get();}
  function message(text){if(root)root.getElementById('message').textContent=text;}
  function apply(n){try{if(n>0){previous=n;if(root)root.getElementById('speed').value=n;}const result=set(n);if(held!==null)held=n;message('Time scale: '+result.toFixed(2)+'×');}catch(e){message(e.message);}}
  function mount(){
    if(host||!document.body)return;
    host=document.createElement('div');host.style.cssText='position:fixed;right:14px;top:70px;z-index:2147483646';document.body.appendChild(host);root=host.attachShadow({mode:'open'});
    root.innerHTML=`<style>:host{all:initial;font:13px system-ui;color:#e5efdd}*{box-sizing:border-box}.panel{width:244px;padding:16px;border:1px solid #738568;border-radius:12px;background:#18251ef5;box-shadow:0 8px 40px #0008}h3{margin:0 0 12px;font-size:16px}.row{display:flex;gap:6px;margin:8px 0}button{font:inherit;flex:1;padding:9px 6px;border:1px solid #6d805f;border-radius:6px;background:#31472b;color:#eef7e5;cursor:pointer}button:hover{background:#496239}p{font-size:11px;line-height:1.4;color:#b9cbae}label{font-size:12px;display:block;margin:12px 0}#message{color:#d6ee99}#open{display:none}summary{cursor:pointer;color:#d6ee99}input[type=range]{width:100%}</style><button id="open">Slope controls</button><div class="panel" id="panel"><h3>Slope practice</h3><div class="row"><button id="quarter">0.25×</button><button id="half">0.5×</button><button id="normal">1×</button><button id="super">4×</button></div><div class="row"><button id="pause">Pause</button><button id="resume">Resume</button></div><label>Speed <span id="readout">1.00×</span><input id="speed" aria-label="Practice speed" type="range" min="0.1" max="8" step="0.05" value="1"></label><label><input id="hold" type="checkbox"> Keep selected speed</label><p id="message">Controls ready after game initialization.</p><details><summary>More controls</summary><p>The memory scanner can inspect other values. Addresses must be identified for each variable.</p><button id="scanner">Open memory scanner</button></details><div class="row"><button id="reset">Reset to normal</button><button id="hide">Hide</button></div></div>`;
    root.getElementById('super').onclick=()=>apply(4);root.getElementById('quarter').onclick=()=>apply(.25);root.getElementById('half').onclick=()=>apply(.5);root.getElementById('normal').onclick=()=>apply(1);root.getElementById('pause').onclick=()=>{try{const n=get();if(n>0)previous=n;}catch{}apply(0);};root.getElementById('resume').onclick=()=>apply(previous||1);
    root.getElementById('speed').oninput=e=>{root.getElementById('readout').textContent=Number(e.target.value).toFixed(2)+'×';apply(e.target.value);};
    root.getElementById('hold').onchange=e=>{try{held=e.target.checked?get():null;}catch(error){e.target.checked=false;message(error.message);}};
    root.getElementById('reset').onclick=()=>{held=null;root.getElementById('hold').checked=false;apply(1);root.getElementById('speed').value=1;};
    root.getElementById('hide').onclick=()=>{root.getElementById('panel').style.display='none';root.getElementById('open').style.display='block';};
    root.getElementById('open').onclick=()=>{root.getElementById('panel').style.display='block';root.getElementById('open').style.display='none';};
    root.getElementById('scanner').onclick=async()=>{
      try{if(!globalThis.UnityWebLab){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='trainer.js';script.onload=resolve;script.onerror=()=>reject(new Error('Put trainer.js next to your HTML file to use the scanner.'));document.head.appendChild(script);});}UnityWebLab.attach(Module.wasmMemory||Module,'Slope game memory');UnityWebLab.show();}catch(e){message(e.message);}
    };
    timer=setInterval(()=>{try{if(held!==null)set(held);if(ready())root.getElementById('readout').textContent=get().toFixed(2)+'×';}catch(e){held=null;message(e.message);}},200);
  }
  const api={module:Module,ready,get,set,reset(){held=null;return set(1);},dispose(){held=null;try{if(ready())set(1);}catch{}clearInterval(timer);host?.remove();delete globalThis.SlopePractice;}};
  globalThis.SlopePractice=api;if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});return api;
}
