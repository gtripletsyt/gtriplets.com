"""Create a derivative framework with the practice panel; preserve Unity's gzip header."""
import argparse,gzip,struct,zlib
from pathlib import Path

def build(original,helper):
    assert original[:2]==b'\x1f\x8b'
    flags=original[3];p=10
    if flags&4:p+=2+struct.unpack_from('<H',original,p)[0]
    for bit in [8,16]:
        if flags&bit:p=original.index(0,p)+1
    if flags&2:p+=2
    text=gzip.decompress(original).decode('utf8')
    beginning='(function(Module) {'
    assert text.startswith(beginning),'Unexpected framework wrapper.'
    injection='\n/* Local Slope practice controls */\n(function(){\n'+helper+'\n'+"globalThis.SlopeModule=Module;\nvar previous=Module.postRun||[];if(typeof previous==='function')previous=[previous];\nModule.postRun=previous.concat([function(){installSlopePractice(Module);}]);\n})();\n"
    patched=(beginning+injection+text[len(beginning):]).encode()
    compressor=zlib.compressobj(level=9,wbits=-15)
    result=original[:p]+compressor.compress(patched)+compressor.flush()+struct.pack('<II',zlib.crc32(patched)&0xffffffff,len(patched)&0xffffffff)
    assert gzip.decompress(result)==patched
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('original');parser.add_argument('helper');parser.add_argument('output');args=parser.parse_args()
    result=build(Path(args.original).read_bytes(),Path(args.helper).read_text())
    with Path(args.output).open('xb') as file:file.write(result)
    print('Created',args.output)
