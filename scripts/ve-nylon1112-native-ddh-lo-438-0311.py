from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='c7fca34ecadcec95466712b46eec810d167084d1d00f11e5d197388c49dae595';b=''
def path(d,w=2):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Từng đỉnh riêng; hai chân CO nối bằng đoạn ngang ngắn nhìn thấy trong native.
path('M75 132L112 112',1.5)
path('M137 112L161 126L197 106L233 126L269 106L305 126L340 106L364 119',1.5)
path('M390 118L408 107L415 107L448 126L484 106L520 126L556 106L588 126L595 126L660 87',1.5)
path('M408 78L408 107M415 78L415 107M588 126L588 153M595 126L595 153',1.5)
path('M125 73L125 93M376 134L376 153',1.5)
path('M102 80C90 99 91 124 102 142M623 82C635 102 633 124 622 143',1.5)
lab(125,117,'N',30)
lab(125,72,'H',30)
lab(376.5,132,'N',30)
lab(376,176,'H',30)
lab(412.5,72,'O',30)
lab(592.5,180,'O',30)
lab(638,144,'n',22)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="732" height="214" viewBox="0 0 732 214"><title>Mạch nguồn1112</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nylon1112-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='12visibleC2N2O2explicitH/2COdouble-EACHshortnativeHORIZONTALjoin-contact2verticalrays/2ROUND+nSUBregularUPRIGHT/N-Hseparate/individualnonperiodicvertices/2freecutendsUNKNOWNcontinuation-NOaddedC-H-formula-caption-stereo-answer/nativeapproxNOTsubpixel'
r=dict(i=1112,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-nylon1112-native-ddh-lo-438-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-nylon1112-lo-438.json').write_text(json.dumps(dict(hash=h,native=[732,214],questions=qs,ghiChu=note,independentSourceAudit=json.loads(Path('/workspace/scratch/source438.json').read_text()),rootSourceAudit='RootOWNnativeFULL3x/all1de12-KT-C4-D1-I-14/COup8x-down10x. 12C individually counted; 2CO short horizontal joins upper408..415y107/lower588..595y126 native visible, rays contact respective ends; no forced common V. 2separate NH upright regular, 2ROUND/nSUB. No chemical additions or answers.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
