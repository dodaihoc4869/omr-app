"""Sơ đồ polysaccharide nguồn840: ba vòng, cầuO, hai đầu lượn và mũi tên."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());a=sorted(p['assets'],key=lambda x:x['hash'])[840];refs={r['where']:r for r in json.loads((G/'docs/hinh-vector-0311/nguon/vi-tri-cong-khai.json').read_text())['refs']}
def line(d,w=2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
b='<g transform="translate(15 15)">'
for dx in [0,177,358]:
 b+=f'<g transform="translate({dx} 0)">'+line('M117 94L151 58H186M216 75L230 94L203 126H144L117 94')+F.label(205,68,'O',29)+'</g>'
b+=line('M117 94L90 129M230 94L245 109M277 109L294 94M407 94L425 111M458 112L475 94M588 94L607 114')
b+=F.label(260,133,'O',29)+F.label(442,139,'O',29)+F.label(623,144,'O',29)
for x1,x2,y in [(33,90,131),(642,680,129)]:
 d=f'M{x1} {y}'
 for x in range(x1+1,x2+1):d+=f'L{x} {y+2.8*math.sin((x-x1)*math.pi/3.5)}'
 b+=line(d,2.2)
b+=line('M466 35L428 97',2)+'<path d="M428 97L432 76L443 83Z" fill="#252440"/></g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="745" height="205" viewBox="0 0 745 205"><title>Sơ đồ polysaccharide và mũi tên theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polysaccharide-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
qs=[]
for q in p['questions']:
 hs=[h for h in q['hinh']if h['hash']==a['hash']]
 if hs:qs.append({'qid':q['qid'],'de':q['de'],'refs':[{'where':h['where'],'viTri':refs[h['where']]['viTri']}for h in hs]})
r={'i':840,'hash':a['hash'],'fileNguon':a['file'],'questions':qs,'daMoNative':True,'svg':fn,'hashSvg':hh,'byteSvg':len(raw),'font':'DDH Rounded','hashPhong':F.HASH,'trangThai':'cho-soat-doc-lap','ghiChuDung':'3ringO+3bridge/terminalO=6O/3sixmemberrings/allbondthinsource/2wavyends/arrowtowardsecondC1–bridgeObond;0addedH/OH/number/n/CIP.'}
(M/'cau-truc-polysaccharide-ddh-lo-167-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
