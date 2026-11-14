from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='c8cfcec1b88438d69be8bb045105752c329f9a6d26a319ed5e50ceaed160489f';b=''
def path(d,w=1.8):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Từng đỉnh đọc riêng; chân carbonyl giữ khoảng trắng nguồn.
path('M80 43L110 76L146 41L177 77L213 42L251 42L283 78L319 43L359 43L389 78L425 43L463 43L493 79L529 44L568 44L599 80L636 45L677 45L707 81L744 46L781 46L813 82L851 46')
path('M214 48L250 48')
path('M320 49L359 49')
path('M426 49L463 49')
path('M530 50L568 50')
path('M637 51L676 51')
path('M745 52L780 52')
path('M106 80L106 109')
path('M113 80L113 109')
last(67,51,'HO',28)
lab(109.5,132,'O',28)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="892" height="162" viewBox="0 0 892 162"><title>Mạch nguồn1115</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dha1115-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='22bareC2O6CCdouble1COdoubleDOWN2verticalraysBOTHnativeWHITEGAP/HOlastO-ALLregularUPRIGHT/individualnonperiodicvertices-rays-RIGHTfreeUP/0stereo-arrows-caption-nums/NOaddedH-formula-name-answer/nativeapproxNOTsubpixel'
r=dict(i=1115,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-dha1115-native-ddh-lo-434-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-dha1115-lo-434.json').write_text(json.dumps(dict(hash=h,native=[892,162],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all1publicde/CO6x-chainL3x-chainR3x.22vertices/6CC/2O. CO gap native rows77-78WHITE; no forced contact. High contrast native serif regular. Background scan flecks not chemical particles/charges. No answers.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
