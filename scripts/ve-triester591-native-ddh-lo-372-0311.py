"""Triglyceride nguồn591: giữ ba mạch riêng, chỉ nhãn số dùng font đậm thật."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-triester591-lo-372.json').read_text());h=p['hash'];g=p['geometry'];b=''
def line(pair):
 (x,y),(u,v)=pair
 return f'<path d="M{x} {y}L{u} {v}" stroke="#252525" stroke-width="1.8" fill="none"/>'
def label(x,y,t,z=28,anchor='middle',weight='de'):return F.label(x,y,t,z,anchor=anchor,fill='#252525',weight=weight)
for row in g['chains']:
 v=row['vertices'];b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+'" stroke="#252525" stroke-width="1.8" fill="none"/>'
 for ray in row['innerParallelRays']:b+=line(ray)
for pair in g['glycerol']['verticalBonds']+g['glycerol']['horizontalEsterBonds']:b+=line(pair)
for row in g['esterO']:b+=line(row['bond'])
for row in g['carbonyls']:
 for ray in row['rays']:b+=line(ray)
for y in [25,88,151]:b+=label(118,y,'O')
for y in [81,144,207]:b+=label(80,y,'O',24)
for baseline,with2 in [(82,True),(144,False),(207,True)]:
 runs=[('H',22,0)]+([('2',15.4,5)]if with2 else[])+[('C',22,0)];left=35+F.advance('C',22)/2-sum(F.advance(t,z)for t,z,dy in runs)
 for t,z,dy in runs:b+=label(left,baseline+dy,t,z,'start');left+=F.advance(t,z)
for x,y,t in [(841,64,'(1)'),(837,125,'(2)'),(837,174,'(3)')]:b+=label(x,y,t,36,weight='dam')
for x,y in g['isolatedGrayMarks']['centersApprox']:b+=f'<circle cx="{x}" cy="{y}" r="1.2" fill="#b5b5b5"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="869" height="216" viewBox="0 0 869 216"><title>Triglyceride theo nguồn591</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='triester591-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=591,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='55C6O=3explicitglycerolC+16-18-18acyl/CCdouble0-1-3/3COdouble2splitfeetCONTACTslopes-nativeV-NOcrossbar/3glycerolH2C-HC-H2CLASTCanchors-2verticals/ALLchemicalregularUPRIGHT-ONLY3numbers(1)(2)(3)trueDAMUPRIGHT/SUB2/EXACT2graydots791187-801187intentUNKNOWNnondata-NOcharge-radical-ellipsis/0arrows-stereo/noaddedX-H-fattyacidnames-Ni-temp-answer-noalias490-460-939-996-801')
(K/'cau-truc-triester591-native-ddh-lo-372-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
