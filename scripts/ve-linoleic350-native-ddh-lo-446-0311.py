from pathlib import Path
import json, hashlib, importlib.util
G=Path(__file__).resolve().parents[1]; K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py'); F=importlib.util.module_from_spec(s); s.loader.exec_module(F)
h='3e1fb2042ac6010ac2a8513e3e17ec941ad5c06159f9f293073a8cc9fc3a53e4'
# Các đỉnh đọc riêng từ nguồn350; không chuẩn hoá nhịp zigzag.
vertices=[(28,85),(72,56),(116,85),(160,56),(204,85),(250,55),(297,55),(342,85),(388,55),(436,55),(482,85),(526,56),(571,85),(615,56),(660,85),(703,56),(748,85),(775,67)]
d='M'+'L'.join(f'{x} {y}' for x,y in vertices)
b=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
for d in ['M257 65L290 65','M395 65L430 65']:
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="butt"/>'
# Neo chữ C đầu; đầu nét nối không phải một carbon trần bổ sung.
b+=F.label(790-F.advance('C',32)/2,66,'COOH',32,anchor='start',fill='#000000')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="898" height="123" viewBox="0 0 898 123"><title>Mạch nguồn350</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest(); fn='linoleic350-native-ddh-'+hh+'.svg'; (K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text()); qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs: qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
assert len(qs)==1 and qs[0]['qid']=='12-KT-C1-D5-I-1'
note='18C2O=17barevertices+COOHfirstC/2CCdouble/condensedCOOH-NOexpandedCO/ALLregularUPRIGHT/individualnonperiodicvertices-rays/0arrow-stereo-charge-caption-nums/NOaddedH-formula-name-answer/nativeapproxNOTsubpixel'
r=dict(i=350,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-linoleic350-native-ddh-lo-446-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-linoleic350-lo-446.json').write_text(json.dumps(dict(hash=h,native=[898,123],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/FULL3x/COOH6x/all1publicde.17barevertices+1COOHfirstC=18C/2O/2CC. No extra terminalC, expandedCO, caption from publicstem, implicitH or answer. Native top55vs56 drift retained. All regular upright; no alias.'),ensure_ascii=False,indent=2)+'\n')
print(hh,len(raw))
