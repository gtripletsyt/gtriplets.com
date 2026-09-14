#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const input=process.argv[2];
if(!input){console.log('Usage: node rebuild.cjs PATH_TO_EDITED.wat\nValidates the new code, backs up the current game binary, and installs the new binary.');process.exit(0);}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'slope-rebuild-'));
try{
  const wasm=path.join(temp,'new.wasm');
  for(const [tool,args]of [['wat2wasm',[path.resolve(input),'--enable-all','-o',wasm]],['wasm-validate',[wasm,'--enable-all']]]){
    execFileSync(process.execPath,['--max-old-space-size=3072',path.join(__dirname,'tools',tool),...args],{stdio:'inherit',timeout:180000});
  }
  const target=path.join(__dirname,'game','slope.wasm'),backup=target+'.original';
  if(!fs.existsSync(backup))fs.copyFileSync(target,backup,fs.constants.COPYFILE_EXCL);
  fs.copyFileSync(wasm,target);console.log('Installed validated game/slope.wasm. Reload the local game.\nOriginal backup: game/slope.wasm.original');
}catch(e){console.error('Rebuild failed; '+e.message);process.exitCode=1;}
finally{fs.rmSync(temp,{recursive:true,force:true});}
