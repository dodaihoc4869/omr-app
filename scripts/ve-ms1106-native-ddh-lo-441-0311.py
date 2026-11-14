from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='c6de02bc17e42d09a898767b9bcc1eac053403d6772fb6ed62e07ef07fdbaf00';b=''
source=json.loads(Path('/workspace/scratch/source441.json').read_text());geo=source['geometry']
def path(d,w=2,color='#202020'):
 global b
 b+=f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=22,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000',weight='dam')
# Các cột riêng theo native; không suy ion hay cường độ chính xác từ ảnh quét.
for q in geo['peakStrokeGuides']:path(f"M{q['x']} {q['topY']}L{q['x']} {q['bottomY']}",q['width'],'#92272d')
path('M80 24L593 24L593 292L80 292Z')
for j,x in enumerate(geo['xtickCenters']):path(f'M{x} 292L{x} {299 if j%10==0 else 296}',2.5)
for j,y in enumerate(geo['ytickCenters']):path(f'M{73 if j%4==0 else 76} {y}L80 {y}',2.5)
for q in geo['xNumericLabels']:lab(q['center'][0],317,q['literal'])
for q in geo['yNumericLabels']:lab(q['bbox'][2],q['bbox'][3],q['literal'],22,'end')
for q in geo['peakLabels']:
 x0,y0,x1,y1=q['bbox'];lab((x0+x1)/2,y1,q['literal'],19)
b+='<g transform="translate(33 159.5)rotate(-90)">'+F.label(0,0,'Cường độ tương đối %',22.5,fill='#000000',weight='dam')+'</g>'
lab(338.5,334,'m/z')
# Ba mảnh chưa rõ ý nghĩa được giữ, không phục hồi thành chữ hay dấu dữ liệu.
b+='<path d="M69.5 2.5L77.5 2.5M204.5 2.5L210 2.5" fill="none" stroke="#777777" stroke-width=".7"/>'
b+='<path d="M33.5 308L36.5 307.5L38 310L35 310.5Z" fill="#555555"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="608" height="338" viewBox="0 0 608 338"><title>Phổ nguồn1106</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms1106-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='23individualREDUPstrokes-NOT23scientificallyassignedions/7peaklabels15-27-29-31-42-59-60/61X21Ystems7X6Ynums-Y0.0DOT/ALLTRUEdamUPRIGHTinclmz-Yrotminus90-percentNOparens/closedframe0heads0grid/2TOP1LEFTunknownfragmentsKEEP/noaddedmolecule-ionidentity-answer/nativepixelheightsNOTexactpercent/nativeapproxNOTsubpixel'
r=dict(i=1106,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-ms1106-native-ddh-lo-441-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-ms1106-lo-441.json').write_text(json.dumps(dict(hash=h,native=[608,338],questions=qs,ghiChu=note,independentSourceAudit=source,rootSourceAudit='RootOWNnativeFULL3x/all1deDH-11-C3-B12-III-5/baselineL8x-R6x/mz12x/TOP5x/Y3x. 23individually visibleREDUPstrokes incl tinyweakstrokes, NOT23scientificallyassignedionclaim/noexactabundanceinferred.61X21Ystems7X6Ynums7peaklabels/0.0DOT. ALLtrueDAMUPRIGHT incl m/z: OWN12x verticalmstem; no default italic from otherMS. Yrot−90/Cường độ tương đối % NOparentheses. 2TOPtinyfragments+1LEFTfleckUNKNOWNretain/noRestoration/noextraquantities-or-answer.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
