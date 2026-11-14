from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1ce5ad4bf99d1760a45949902a20d162fcf535907e62120fcb7820f1b8ef7405';b=''
def path(d,w=1.8):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Từng đỉnh đọc riêng; chân carbonyl giữ khoảng trắng nguồn.
path('M72 43L99 77L132 41L158 77L192 42L226 42L254 78L287 43L322 43L349 78L382 43L416 43L442 79L475 44L509 44L536 80L570 45L605 45L632 81L666 46L700 46L727 82L762 46')
path('M193 49L225 49')
path('M288 50L322 50')
path('M383 50L416 50')
path('M476 51L509 51')
path('M571 52L604 52')
path('M667 53L700 53')
path('M95.5 80L95.5 110')
path('M102 80L102 110')
last(61,50,'HO',26)
lab(99.5,131,'O',26)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="802" height="161" viewBox="0 0 802 161"><title>Mạch nguồn167</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dha167-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='22bareC2O6CCdouble1COdoubleDOWN2verticalraysBOTHnativeWHITEGAP/HOlastO-ALLregularUPRIGHT/individualnonperiodicvertices-rays-RIGHTfreeUP/0stereo-arrows-caption-nums/NOaddedH-formula-name-answer/nativeapproxNOTsubpixel'
r=dict(i=167,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-dha167-native-ddh-lo-445-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-dha167-lo-445.json').write_text(json.dumps(dict(hash=h,native=[802,161],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all1publicde/CO6x/FULL/all1publicde.22vertices/6CC/2O. CO gap native row78WHITE; no forced contact. Independently read source445.json; native drift retained; no alias1115. High contrast native serif regular. Background scan flecks not chemical particles/charges. No answers.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
