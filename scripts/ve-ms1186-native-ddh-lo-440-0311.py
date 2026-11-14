from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='d6f751e7f86a06e7cdeb30694310f11229c045b006f6312f69f5719315e26c6f';b=''
source=json.loads(Path('/workspace/scratch/source440.json').read_text());geo=source['geometry']
def path(d,w=1.5,color='#303030'):
 global b
 b+=f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=22,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def base(x):return 331+(x-127)*2.5/565
# Các vệt cao và vệt rất nhỏ giữ riêng theo native, không gán lượng ion suy diễn.
for q in geo['mainPeaks']:path(f"M{q['x']} {q['topY']}L{q['x']} {q['bottomY']}",q['width'],'#202020')
for q in geo['additionalUpwardInk']:path(f"M{q['x']} {q['topY']}L{q['x']} {base(q['x']):.6f}",q['width'],'#303030')
path('M127 36.5L693 39L692 333.5L127 331Z')
# Từng vị trí vạch chia lấy riêng từ native, không thay thành lưới đều.
for j,x in enumerate(geo['xtickCenters']):path(f'M{x} {base(x):.6f}L{x} {base(x)+(7 if j%10==0 else 3):.6f}')
for j,y in enumerate(geo['ytickCenters']):path(f'M{120 if j%4==0 else 123} {y}L127 {y}')
for q in geo['xLabels']:lab(q['center'][0],359,q['literal'])
for q in geo['yLabels']:lab(120,q['bbox'][3],q['literal'],22,'end')
b+='<g transform="translate(68 190)rotate(-90)">'+F.label(0,0,'Cường độ tương đối (%)',20,fill='#000000')+'</g>'
b+='<g transform="translate(410 384)skewX(-10)">'+F.label(0,0,'m/z',20,fill='#000000')+'</g>'
# Vết ngoài đồ thị có ý nghĩa chưa rõ; không biến thành dấu thập phân hay dữ liệu.
b+='<path d="M665.5 366.5L668.2 366.8L670 369L666.3 369.3Z" fill="#555555"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="764" height="416" viewBox="0 0 764 416"><title>Phổ nguồn1186</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms1186-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='5mainUPpeaks14additionaltinyUPink-INTENTuncertainNOT19quantitativepeaks/61X21Yticks7X6Ynums/0heads0grid/closedframeTOP36.5to39-BASE331to333.5driftKEEP/ALLregularUPRIGHTexceptmzREGULARITALIC-Yrotminus90/unknownoutsidefleck665366KEEP/backgroundgrainNOTdata/noaddedmolecule-ion-name-answer/nativeapproxNOTsubpixel'
r=dict(i=1186,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-ms1186-native-ddh-lo-440-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-ms1186-lo-440.json').write_text(json.dumps(dict(hash=h,native=[764,416],questions=qs,ghiChu=note,independentSourceAudit=source,rootSourceAudit='RootOWNnativeFULL3x/all1de12-C1-B1-D2-II-1/baselineL8x-R6x-Y3x/fleck10x/ticks28629520x. Main5 tall5 visible; 14tinyUPstrokes preserved literalink, tiny1–2px intent uncertain NOT19quantitativepeaks claim. All61X/21Ytickstems counted; sourceagent guides286/295.5 described interpolation, rootOWN20x confirms BOTHvisible downward stems, no inventedperiodicgrid. FrameTOP36.5→39 BASE331→333.5 drift. Native pixel heights NOT exact percentages. Sourcegrain background not extra particles/data. m/z regularitalic/Ytitle regularUPRIGHTrot−90; 7X6Yregularnums; unknownoutsidefleck kept.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
