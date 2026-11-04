"""Polymer hai vòng ghế nguồn675, giữ OH, O cầu và ngoặc n."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());a=sorted(p['assets'],key=lambda x:x['hash'])[675];refs={r['where']:r for r in json.loads((G/'docs/hinh-vector-0311/nguon/vi-tri-cong-khai.json').read_text())['refs']}
b='<g transform="translate(15 15) scale(2)" stroke-linejoin="round" stroke-linecap="round">'
def line(d,w=1.7):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}"/>'
def label(x,y,t):return F.label(x,y,t,23)
b+=line('M32 115L71 105L111 115L138 107M158 116L171 140L133 130L94 140L71 105')+line('M94 140L133 130',4.5)
b+='<path d="M71 105L90 142L98 139Z" fill="#252440"/>'
b+=label(151,114,'O')+line('M111 115L90 80L103 57M94 140L79 135M133 130L144 155M171 140L200 133M222 133L252 140')
b+=label(120,54,'OH')+label(57,146,'HO')+label(162,177,'OH')+label(211,139,'O')
b+=line('M252 140L273 105L313 115L351 105L335 132M321 137L289 130L252 140')
b+='<path d="M351 105L331 135L340 133Z" fill="#252440"/>'+line('M289 130L321 137',4.5)
b+=label(332,150,'O')+line('M273 105L262 108M313 115L326 93M289 130L271 163L285 191M351 105L381 113M404 113L432 105')
b+=label(239,120,'HO')+label(343,91,'OH')+label(301,213,'OH')+label(393,125,'O')
b+=line('M46 32H35V212H46M404 32H414V212H404')+F.label(427,218,'n',17)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="970" height="530" viewBox="0 0 970 530"><title>Polymer hai vòng ghế theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='chair-polymer-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
qs=[]
for q in p['questions']:
 hs=[h for h in q['hinh']if h['hash']==a['hash']]
 if hs:qs.append({'qid':q['qid'],'de':q['de'],'refs':[{'where':h['where'],'viTri':refs[h['where']]['viTri']}for h in hs]})
r={'i':675,'hash':a['hash'],'fileNguon':a['file'],'questions':qs,'daMoNative':True,'svg':fn,'hashSvg':hh,'byteSvg':len(raw),'font':'DDH Rounded','hashPhong':F.HASH,'trangThai':'cho-soat-doc-lap','ghiChuDung':'2chair/3OHmỗivòng/2ringO+2bridgeO/ngoặc2đầu+stubs+n;giữđộđậmnguồnkhônggánCIP/khôngthêmH/sốC.'}
(M/'cau-truc-chair-polymer-ddh-lo-165-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
