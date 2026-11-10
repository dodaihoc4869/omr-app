"""Hai mạch acid nguồn811, giữ nguyên cả lỗi chữ Arachidomic."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='964586ad421f1691832a4a0602c12297000636c9d475b5e0d30b58edd927223c';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
def line(d):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
def methyl(end,y):
 global b
 parts=[('H',30,0),('3',21,5),('C',30,0)];x=end-sum(F.advance(t,z)for t,z,_ in parts)
 for t,z,dy in parts:b+=F.label(x,y+dy,t,z,anchor='start');x+=F.advance(t,z)
left=[(145,98),(145,147),(187,170),(229,146),(229,99),(271,75),(312,99),(312,146),(354,170),(396,146),(396,99),(438,75),(480,99),(480,146),(522,170),(564,146),(564,99),(606,75),(649,99)]
right=[(843,95),(843,142),(885,166),(927,142),(927,94),(969,70),(1010,94),(1010,142),(1052,166),(1094,142),(1094,94),(1136,70),(1178,94),(1178,142),(1220,166),(1262,142),(1262,94),(1304,70),(1346,94),(1346,142),(1392,153)]
for start,pts in [((117,82),left),((815,79),right)]:line('M'+'L'.join(f'{x} {y}'for x,y in [start]+pts))
line('M229 94L269 71 M314 141L355 165 M397 94L436 71 M482 141L523 165 M845 137L886 160 M928 89L967 66 M1012 137L1053 160 M1095 89L1134 66 M1180 137L1221 160 M1263 89L1302 66')
line('M645 96L673 81 M649 102L677 87 M649 99V131 M1391 150L1418 134 M1392 159L1422 140 M1392 153V187')
methyl(112,84);methyl(811,80)
for x,y in [(689,85),(1434,143)]:b+=F.label(x,y,'O',32)
for x,y in [(649,161),(1392,217)]:b+=F.label(x-F.advance('O',32)/2,y,'OH',32,anchor='start')
b+=F.label(436,228,'Arachidomic acid (ARA)',27)+F.label(1140,225,'Docosahexaenoic acid (DHA)',27)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1507" height="276" viewBox="0 0 1507 276"><title>Hai cấu trúc theo nguồn811</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hai-acid-native811-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=811,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='LEFT20C4CCdouble-RIGHT22C6CCdouble/4O/2H3C3sub/2OH-Oanchors/2COdouble-LEFTcontact-RIGHTuppernativeWHITEGAP1-2px-lowercontact/ALLthinregularupright/EXACTArachidomic acid (ARA)-Docosahexaenoic acid (DHA)/noaddedH-CH3-nums-EZ-omegaanswer/noalias')
(K/'cau-truc-hai-acid-native811-ddh-lo-325-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
