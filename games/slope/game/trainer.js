/* UnityWeb Lab local memory trainer. Load before the game's loader for automatic memory capture. */
(() => {
  'use strict';
  if (globalThis.UnityWebLab) { globalThis.UnityWebLab.show?.(); return; }
  const types={
    i32:{size:4,get:'getInt32',set:'setInt32',min:-2147483648,max:2147483647},
    u32:{size:4,get:'getUint32',set:'setUint32',min:0,max:4294967295},
    f32:{size:4,get:'getFloat32',set:'setFloat32'},
    f64:{size:8,get:'getFloat64',set:'setFloat64'},
    u8:{size:1,get:'getUint8',set:'setUint8',min:0,max:255}
  };
  const memories=[], freezes=new Map(), history=[];
  let selected=-1,candidates=[],scanType='i32',busy=false,cancelled=false,truncated=false;
  let root=null,host=null,interval=null,scanned=false;
  const CAP=200000;
  const yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0));
  function check(ok,message){if(!ok)throw new Error(message);}
  function number(value,type){
    check(types[type],'Unknown value type.');
    check(String(value).trim()!=='','Enter a value.');const n=Number(value),t=types[type];
    check(Number.isFinite(n),'Enter a finite number.');
    if(t.min!==undefined)check(Number.isInteger(n)&&n>=t.min&&n<=t.max,'Value is outside the '+type+' range.');
    if(type==='f32')check(Number.isFinite(Math.fround(n)),'Value is outside the Float32 range.');
    return type==='f32'?Math.fround(n):n;
  }
  function bufferOf(value){
    if(value instanceof WebAssembly.Memory)return value.buffer;
    if(value?.HEAPU8)return value.HEAPU8.buffer;
    if(value instanceof ArrayBuffer||(typeof SharedArrayBuffer!=='undefined'&&value instanceof SharedArrayBuffer))return value;
    return null;
  }
  function attach(value,label='Manually attached memory'){
    const buffer=bufferOf(value);check(buffer,'Pass a WebAssembly.Memory, an Emscripten Module with HEAPU8, or an ArrayBuffer.');
    const existing=memories.findIndex(m=>bufferOf(m.source)===buffer);
    if(existing>=0)return existing;
    memories.push({source:value,label});if(selected<0)selected=0;
    renderMemory();status('Memory attached. Search for a value you can see in the game.');return memories.length-1;
  }
  function capture(result,imports){
    const instance=result instanceof WebAssembly.Instance?result:result?.instance;
    if(instance)for(const [name,value]of Object.entries(instance.exports))if(value instanceof WebAssembly.Memory)attach(value,'Export: '+name);
    if(imports)for(const group of Object.values(imports))if(group&&typeof group==='object')for(const [name,value]of Object.entries(group))if(value instanceof WebAssembly.Memory)attach(value,'Import: '+name);
    return result;
  }
  const nativeInstantiate=WebAssembly.instantiate, nativeStreaming=WebAssembly.instantiateStreaming;
  async function wrappedInstantiate(source,imports,...rest){const result=await Reflect.apply(nativeInstantiate,WebAssembly,[source,imports,...rest]);try{capture(result,imports);}catch{}return result;}
  async function wrappedStreaming(source,imports,...rest){const result=await Reflect.apply(nativeStreaming,WebAssembly,[source,imports,...rest]);try{capture(result,imports);}catch{}return result;}
  WebAssembly.instantiate=wrappedInstantiate;
  if(nativeStreaming)WebAssembly.instantiateStreaming=wrappedStreaming;
  function discover(){
    for(const [label,obj]of [['Module',globalThis.Module],['unityInstance.Module',globalThis.unityInstance?.Module],['gameInstance.Module',globalThis.gameInstance?.Module]]) {
      try{if(obj?.HEAPU8)attach(obj,label);}catch{}
    }
    renderMemory();return memories.map((m,index)=>({index,label:m.label,bytes:bufferOf(m.source)?.byteLength||0}));
  }
  function view(){check(selected>=0,'No memory attached. Load this script before the game loader, or call UnityWebLab.attach(memory).');const buffer=bufferOf(memories[selected].source);check(buffer?.byteLength,'Memory is unavailable. Reload the game.');return new DataView(buffer);}
  function address(value,type='i32',dv=view()){
    check(types[type],'Unknown value type.');check(String(value).trim()!=='','Enter a memory address.');
    const n=Number(value);check(Number.isSafeInteger(n)&&n>=0&&n+types[type].size<=dv.byteLength,'Address is outside this memory.');return n;
  }
  function read(addr,type=scanType){const dv=view();return dv[types[type].get](address(addr,type,dv),true);}
  function equal(a,b,type){return type==='f32'||type==='f64'?Math.abs(a-b)<=Math.max(1e-5,Math.abs(b)*1e-6):a===b;}
  function write(addr,value,type=scanType,remember=true){
    const n=number(value,type),dv=view(),p=address(addr,type,dv),previous=dv[types[type].get](p,true);
    dv[types[type].set](p,n,true);
    if(remember){history.push({memory:selected,addr:p,type,previous,value:n});if(history.length>200)history.shift();}
    return {addr:p,previous,value:n};
  }
  function freeze(addr,value,type=scanType){
    check(types[type],'Unknown type.');const p=address(addr,type),n=number(value,type),key=selected+':'+p+':'+type;
    if(!freezes.has(key))write(p,n,type);
    freezes.set(key,{memory:selected,addr:p,type,value:n});renderFrozen();return key;
  }
  function unfreeze(key){if(key)freezes.delete(key);else freezes.clear();renderFrozen();}
  function undo(){
    const item=history.pop();check(item,'There is no write to undo.');
    const old=selected;selected=item.memory;
    try{freezes.delete(item.memory+':'+item.addr+':'+item.type);write(item.addr,item.previous,item.type,false);}
    finally{selected=old;}renderFrozen();return item;
  }
  function selectMemory(index){
    check(!busy,'Wait for the scan to finish.');check(Number.isInteger(index)&&memories[index],'Unknown memory.');
    unfreeze();selected=index;candidates=[];scanned=false;history.length=0;renderResults();renderMemory();
  }
  async function scan(value,type='i32',options={}){
    check(!busy,'A scan is already running.');const needle=number(value,type),size=types[type].size,initial=view();
    const start=options.start===undefined?0:Number(options.start),end=options.end===undefined?initial.byteLength:Number(options.end);
    check(Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&end<=initial.byteLength&&start<end,'Invalid scan range.');
    busy=true;cancelled=false;truncated=false;scanned=false;scanType=type;candidates=[];let dv=initial;
    try{
      const aligned=Math.ceil(start/size)*size;
      for(let p=aligned;p+size<=end;p+=size){
        const n=dv[types[type].get](p,true);
        if(equal(n,needle,type)){candidates.push({addr:p,previous:n});if(candidates.length>=CAP){truncated=true;break;}}
        if((p-aligned)%(1024*1024)===0){status('Scanning '+Math.round((p-start)/(end-start)*100)+'%…');await yieldFrame();if(cancelled)throw new Error('Scan cancelled.');dv=view();}
      }
      scanned=true;status(candidates.length.toLocaleString()+' matches'+(truncated?' (limit reached; narrow the range and rescan for a complete search).':'. Change the value in the game, then use Filter.'));
      return candidates.map(c=>c.addr);
    }catch(e){candidates=[];throw e;}finally{busy=false;renderResults();}
  }
  async function next(mode='exact',value){
    check(!busy,'A scan is already running.');check(scanned,'Run an initial scan first.');
    check(['exact','changed','unchanged','increased','decreased'].includes(mode),'Unknown filter.');
    const needle=mode==='exact'?number(value,scanType):null,found=[];busy=true;cancelled=false;let dv=view();
    try{
      for(let i=0;i<candidates.length;i++){
        const c=candidates[i];if(c.addr+types[scanType].size>dv.byteLength)continue;
        const n=dv[types[scanType].get](c.addr,true),keep=mode==='exact'?equal(n,needle,scanType):mode==='changed'?n!==c.previous:mode==='unchanged'?n===c.previous:mode==='increased'?n>c.previous:n<c.previous;
        if(keep)found.push({addr:c.addr,previous:n});
        if(i%20000===0){await yieldFrame();if(cancelled)throw new Error('Filter cancelled.');dv=view();}
      }
      candidates=found;status(found.length.toLocaleString()+' matches'+(truncated?' within the capped initial scan.':'.'));return found.map(c=>c.addr);
    }finally{busy=false;renderResults();}
  }
  function sendMessage(objectName,method,value){
    const instance=globalThis.unityInstance||globalThis.gameInstance;
    check(instance?.SendMessage,'Expose your instance as window.unityInstance in your local loader to use SendMessage.');
    check(objectName&&method,'Supply the existing GameObject and method names.');
    if(value===undefined)instance.SendMessage(objectName,method);else instance.SendMessage(objectName,method,value);
  }
  function exportRecipe(){
    return {tool:'UnityWeb Lab',version:1,note:'Addresses apply to this game build and may change on reload. Verify each address before applying.',entries:[...freezes.values()].map(v=>({...v}))};
  }
  function importRecipe(recipe){
    check(recipe?.version===1&&Array.isArray(recipe.entries),'Invalid recipe.');
    check(recipe.entries.length<=1000,'Recipe is too large.');
    // Validate every entry before any write, then apply only when explicitly called.
    const validated=recipe.entries.map(e=>{
      check(Number.isInteger(e.memory)&&memories[e.memory]&&types[e.type],'Recipe refers to an unavailable memory or type.');
      const dv=new DataView(bufferOf(memories[e.memory].source));return {...e,addr:address(e.addr,e.type,dv),value:number(e.value,e.type)};
    });
    const old=selected;try{for(const e of validated){selected=e.memory;freeze(e.addr,e.value,e.type);}}finally{selected=old;}return validated.length;
  }
  const $=id=>root?.getElementById(id);
  function status(message){if($('status'))$('status').textContent=message;}
  function renderMemory(){
    if(!$('memory'))return;const select=$('memory');select.replaceChildren();
    if(!memories.length){const o=document.createElement('option');o.textContent='Waiting for game memory…';select.append(o);}
    memories.forEach((m,i)=>{const o=document.createElement('option');o.value=i;o.textContent=i+' · '+m.label+' · '+Math.round((bufferOf(m.source)?.byteLength||0)/1048576)+' MiB';select.append(o);});select.value=selected;
  }
  function renderResults(){
    if(!$('matches'))return;$('matches').textContent=candidates.length.toLocaleString()+' matches · '+scanType+' · first 60 shown';const list=$('results');list.replaceChildren();
    for(const c of candidates.slice(0,60)){
      const button=document.createElement('button');button.className='result';let current='unavailable';try{current=String(read(c.addr,scanType));}catch{}
      button.textContent='0x'+c.addr.toString(16).padStart(8,'0')+'    '+current;
      button.onclick=()=>{$('address').value='0x'+c.addr.toString(16);$('writeType').value=scanType;$('writeValue').value=current;};list.append(button);
    }
  }
  function renderFrozen(){if($('frozen'))$('frozen').textContent=freezes.size+' frozen value'+(freezes.size===1?'':'s');}
  function download(name,content){const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function mount(){
    if(!document.body||host)return;
    host=document.createElement('div');host.style.cssText='position:fixed;top:16px;right:16px;z-index:2147483647;';document.body.append(host);root=host.attachShadow({mode:'open'});
    root.innerHTML=`<style>
      :host{all:initial;font:13px system-ui;color:#e8eef5}*{box-sizing:border-box}#panel{width:355px;max-height:88vh;overflow:auto;border:1px solid #526178;background:#142033;border-radius:14px;box-shadow:0 16px 60px #0008;padding:16px}header{display:flex;justify-content:space-between;align-items:center}h2{font-size:17px;margin:0}p{color:#b5c4d7;line-height:1.45;margin:10px 0}button,input,select{font:inherit;color:inherit;background:#22334a;border:1px solid #50627b;border-radius:6px;padding:7px;min-width:0}button{cursor:pointer}button:hover{background:#34516e}button.primary{background:#17614f;border-color:#3a9a80}input,select{width:100%}label{display:block;color:#bdcce0;font-size:11px;margin:8px 0 4px}.row{display:flex;gap:6px;margin:7px 0}.row>*{flex:1}#status{min-height:35px;color:#8fe1c2;white-space:pre-wrap}#results{max-height:145px;overflow:auto;margin-top:5px}.result{width:100%;text-align:left;border:0;border-radius:0;font:12px ui-monospace,monospace;display:block;padding:6px}small{color:#b5c4d7}details{margin:10px 0}summary{cursor:pointer;color:#c0d8ef}#toggle{background:#142033;border:1px solid #526178;display:none}#matches,#frozen{font-size:11px;color:#b5c4d7}.rule{border-top:1px solid #354960;margin-top:14px;padding-top:10px}
      </style><button id="toggle">Open UnityWeb Lab</button><section id="panel">
      <header><h2>UnityWeb Lab</h2><button id="minimize" title="Minimize">−</button></header>
      <p>Find a local game value, change it in-game, then narrow your search.</p>
      <label for="memory">Game memory</label><div class="row"><select id="memory"></select><button id="attach" style="flex:0">Refresh</button></div>
      <div class="row"><div><label for="type">Scan type</label><select id="type"><option value="i32">Int32 (whole numbers)</option><option value="u32">Uint32</option><option value="f32">Float32 (speed etc.)</option><option value="f64">Float64</option><option value="u8">Byte (0–255)</option></select></div><div><label for="value">Current game value</label><input id="value" placeholder="e.g. 100" inputmode="decimal"></div></div>
      <details><summary>Limit scan range</summary><div class="row"><input id="start" aria-label="Scan start" placeholder="Start: 0x0"><input id="end" aria-label="Scan end" placeholder="End: memory size"></div><small>Addresses are byte offsets. Scans use natural type alignment.</small></details>
      <div class="row"><button id="scan" class="primary">New scan</button><button id="cancel">Cancel scan</button></div>
      <div class="row"><select id="filter" aria-label="Filter mode"><option value="exact">Equals value above</option><option value="changed">Changed</option><option value="unchanged">Unchanged</option><option value="increased">Increased</option><option value="decreased">Decreased</option></select><button id="next">Filter</button></div>
      <p id="status">Waiting for WebAssembly memory. Start or reload the game with this script loaded first.</p>
      <div id="matches"></div><div id="results"></div>
      <div class="rule"><small>Click a result to select its address.</small><div class="row"><input id="address" aria-label="Write address" placeholder="Address: 0x100"><select id="writeType" aria-label="Write type"><option>i32</option><option>u32</option><option>f32</option><option>f64</option><option>u8</option></select></div>
      <label for="writeValue">New value</label><input id="writeValue" placeholder="e.g. 999">
      <div class="row"><button id="write" class="primary">Write once</button><button id="freeze">Freeze value</button><button id="undo">Undo last</button></div>
      <div class="row"><button id="unfreeze">Stop all freezes</button><button id="export">Export recipe</button></div><div id="frozen">0 frozen values</div></div>
      <details><summary>Call an existing Unity method</summary><p>Requires window.unityInstance and a real method already compiled into the game.</p><input id="object" aria-label="GameObject name" placeholder="GameObject name"><input id="method" aria-label="Method name" placeholder="Method name" style="margin:6px 0"><input id="argument" aria-label="Optional string argument" placeholder="Optional string argument"><button id="send" style="margin-top:6px">SendMessage</button></details>
      <p><small>Ctrl+Shift+L hides this panel. Addresses may change after reload. Freeze can affect game saves. Stop freezes before leaving a scene.</small></p>
      </section>`;
    const action=(id,fn)=>$(id).onclick=async()=>{try{await fn();}catch(e){status(e.message);}};
    action('minimize',()=>api.hide());action('toggle',()=>api.show());action('attach',()=>{discover();if(!memories.length)status('No accessible memory found. Use the local game launcher, which loads this script before the game.');});
    $('memory').onchange=()=>{try{selectMemory(Number($('memory').value));}catch(e){status(e.message);renderMemory();}};
    action('scan',()=>scan($('value').value,$('type').value,{...($('start').value?{start:$('start').value}:{}),...($('end').value?{end:$('end').value}:{})}));
    action('next',()=>next($('filter').value,$('value').value));action('cancel',()=>{cancelled=true;});
    action('write',()=>{const r=write($('address').value,$('writeValue').value,$('writeType').value);status('Wrote '+r.value+' (previously '+r.previous+').');renderResults();});
    action('freeze',()=>{freeze($('address').value,$('writeValue').value,$('writeType').value);status('Freeze enabled.');});
    action('unfreeze',()=>{unfreeze();status('All freezes stopped. Values are left at their current state.');});
    action('undo',()=>{const item=undo();status('Restored '+item.previous+'.');renderResults();});
    action('export',()=>download('unityweb-cheat-recipe.json',JSON.stringify(exportRecipe(),null,2)));
    action('send',()=>{sendMessage($('object').value,$('method').value,$('argument').value||undefined);status('Message sent. Check the game console for Unity errors.');});
    renderMemory();renderResults();renderFrozen();
  }
  const api={version:'1.0',attach,discover,selectMemory,read,write,scan,next,freeze,unfreeze,undo,sendMessage,exportRecipe,importRecipe,
    get results(){return candidates.map(c=>({...c}));},
    show(){mount();if($('panel')){$('panel').style.display='block';$('toggle').style.display='none';}},
    hide(){if($('panel')){$('panel').style.display='none';$('toggle').style.display='block';}},
    dispose(){cancelled=true;unfreeze();clearInterval(interval);if(WebAssembly.instantiate===wrappedInstantiate)WebAssembly.instantiate=nativeInstantiate;if(WebAssembly.instantiateStreaming===wrappedStreaming)WebAssembly.instantiateStreaming=nativeStreaming;document.removeEventListener('keydown',keyHandler);host?.remove();delete globalThis.UnityWebLab;}
  };
  globalThis.UnityWebLab=api;
  function keyHandler(e){if(e.ctrlKey&&e.shiftKey&&e.code==='KeyL'){e.preventDefault();if($('panel')?.style.display==='none')api.show();else api.hide();}}
  document.addEventListener('keydown',keyHandler);
  if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
  interval=setInterval(()=>{
    const old=selected;
    for(const [key,e]of freezes){try{selected=e.memory;write(e.addr,e.value,e.type,false);}catch(error){freezes.delete(key);status('Freeze stopped: '+error.message);renderFrozen();}}
    selected=old;
  },100);
  discover();
})();
