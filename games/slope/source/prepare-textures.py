import sys,struct
from pathlib import Path
import UnityPy
from PIL import Image
root=Path(__file__).resolve().parents[1]
archive=root/'recovered/data-archive-contents'
src=archive/'data.unity3d'
e=UnityPy.load(str(src))
for o in e.objects:
 if o.assets_file.name=='sharedassets0.assets' and o.type.name=='Texture2D' and o.path_id in [24,32,38]:
  t=o.read();im=t.image
  if o.path_id==24: im=im.resize((256,256),Image.Resampling.NEAREST)
  t.set_image(im.convert('RGBA'),target_format=4);t.m_IsReadable=True;t.save();print('Writable texture',o.path_id,t.m_Width,t.m_Height)
bundle=next(iter(e.files.values())).save(packer='lz4')
entries=[]
for path in sorted(archive.rglob('*')):
 if path.is_file():
  name=path.relative_to(archive).as_posix().encode()
  entries.append((name,bundle if name==b'data.unity3d' else path.read_bytes()))
end=20+sum(12+len(n) for n,b in entries)
header=bytearray(b'UnityWebData1.0\0'+struct.pack('<I',end));payload=bytearray();offset=end
for n,b in entries:header+=struct.pack('<III',offset,len(b),len(n))+n;payload+=b;offset+=len(b)
(root/'game/slope.data').write_bytes(header+payload)
print('Updated game/slope.data:',len(header+payload),'bytes')
