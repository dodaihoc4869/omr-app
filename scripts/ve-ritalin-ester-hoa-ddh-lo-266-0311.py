"""Nguồn777/hash918d2741…: giữ nhãn ClH₂N và hai công thức thu gọn đúng ảnh nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='918d27418a2f6a52769194d32367ef605359187bb0c1bfbd37b22ebf7a169cc2';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<g transform="translate(15 10)">'
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
for dx,dy,label in [(0,0,'COOH'),(546,-3,'COOCH₃')]:
 b+=f'<g transform="translate({dx} {dy})">'
 b+=line('M59 172L113 141L167 172V233L113 264L59 233Z M66 178V227 M113 149L160 176 M113 256L160 229 M167 172L220 141L273 172L326 141L380 172V233L326 264L285 241 M273 172V220 M220 141V94')
 b+=F.label(220-F.advance('C',24)/2,89,label,24,'start')
 # N phải ở đúng neo C–N; không để liên kết chạm chữ Cl/H của cùng nhóm.
 b+=F.label(273+F.advance('N',24)/2,243,'ClH₂N',24,'end')
 b+='</g>'
b+=line('M412 202H560')+'<path d="M555 196L577 202L555 208Z" fill="#252440"/>'
b+=F.label(486,184,'+ CH₃OH/HCl',24)
b+=F.label(239,326,'Ritalinic acid hydrochloride',26)+F.label(788,321,'methylphenidate hydrochloride',26)
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1081" height="387" viewBox="0 0 1081 387"><title>Sơ đồ điều chế theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ritalin-ester-hoa-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=777,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='HASH918d2741 riêng/left13C2O1N1Cl-right14C2O1N1Cl/2Ph3doubleeach+2piperidine6member/2ClH2NliteralNanchor/nocharge-stereo/COOHfirstC→COOCH3firstC/1RIGHThead/+CH3OH-HClslash/2captionsuppercaseRleft-lowercaseright/noextraH2O-temp-phase-answer.')
(K/'cau-truc-ritalin-ester-hoa-ddh-lo-266-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
