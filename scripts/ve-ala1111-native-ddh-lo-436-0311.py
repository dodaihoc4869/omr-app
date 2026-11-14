from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='c76dec788a05d5b7e89f649ef7cfa863e10bacc3853f9ae1a9ca1677c72c3fc4';b=''
def path(d,w=2):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Từng đỉnh và tia riêng; chân carbonyl giữ khe sáng nguồn, không ép tiếp xúc.
path('M92 143L139 102L179 147L225 101L268 147L315 102L357 147L405 101L447 147L492 101L539 101L582 146L629 101L678 101L719 146L767 101L814 101L856 146L903 101')
path('M493 109L538 109')
path('M630 109L677 109')
path('M768 109L813 109')
path('M134 62L134 99')
path('M143 62L143 98')
last(76,160,'HO',32)
lab(138.5,60,'O',32)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="940" height="200" viewBox="0 0 940 200"><title>Mạch nguồn1111</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ala1111-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='18bareC2O3CCdouble1COdoubleUP2verticalraysBOTHnativeLIGHTgaps/HOlastO-ALLregularUPRIGHT/individualnonperiodicvertices-rays-RIGHTfreeUP/0stereo-arrows-caption-nums/NOaddedH-formula-name-answer/nativeapproxNOTsubpixel'
r=dict(i=1111,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-ala1111-native-ddh-lo-436-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-ala1111-lo-436.json').write_text(json.dumps(dict(hash=h,native=[940,200],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all1de12-C1-B2-I-12/CO4x-chainL4x-chainR4x.18vertices independently counted, not taken from stem. 3CC/2O/COup2rays native lightfootgaps: sourceAAgray156 at134100, NOTfullpureWHITErow claim. RegularUPRIGHT HOlastO/O. No inferred chemicalparticles from scanflecks. No answers.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
