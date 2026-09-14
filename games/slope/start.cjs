#!/usr/bin/env node
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.join(__dirname,'game');
const server=http.createServer((req,res)=>{
  try{
    if(req.headers.host!=='127.0.0.1:'+server.address().port){res.writeHead(403);return res.end('Use the printed localhost address.');}
    const url=new URL(req.url,'http://127.0.0.1');
    const rel=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';
    const file=path.resolve(root,rel);
    if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Not found');}
    const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.wasm':'application/wasm','.css':'text/css'}[path.extname(file)]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Content-Length':fs.statSync(file).size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self' blob: data:; script-src 'self' 'unsafe-eval'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; worker-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'"});
    fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  }catch(e){if(!res.headersSent)res.writeHead(404);res.end('File unavailable.');}
});
server.listen(Number(process.env.SLOPE_PORT||0),'127.0.0.1',()=>{
  const url='http://127.0.0.1:'+server.address().port;
  console.log('Slope local practice: '+url+'\nKeep this terminal open. Press Ctrl+C to stop.');
  if(!process.argv.includes('--no-open')){
    const cmd=process.platform==='darwin'?'open':process.platform==='win32'?'rundll32':'xdg-open';
    const args=process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];
    const child=spawn(cmd,args,{detached:true,stdio:'ignore'});child.on('error',()=>{});child.unref();
  }
});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
