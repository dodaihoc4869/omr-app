"""Nguồn25: bộ bát sứ khuấy trên lưới/đèn cồn, không chữ nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';h='04376952a642db61207a91a7316e26f6903bba0264c19b02da696e7a74c8a486';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,fill='none',stroke='#252440',w=1.5):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round"/>'
b='<defs><clipPath id="mesh"><path d="M55 164H238L202 238H18Z"/></clipPath><clipPath id="liquid"><ellipse cx="128" cy="291" rx="70" ry="30"/></clipPath></defs>'
# Đèn nằm sau chân giá và lưới.
b+=path('M97 241Q60 258 55 283Q51 307 87 321Q130 339 173 318Q204 303 201 281Q197 257 161 241Z','white')+'<ellipse cx="128" cy="291" rx="70" ry="26" fill="white" stroke="#252440" stroke-width="1.4"/>'
b+='<g clip-path="url(#liquid)">'
for y in range(273,322,8):
 d=f'M54 {y}'
 for x in range(54,202,16):d+=f'Q{x+4} {y-4} {x+8} {y}Q{x+12} {y+4} {x+16} {y}'
 b+=path(d,w=1.3)
b+='</g>'+path('M55 283Q60 315 128 326Q194 319 201 283')+path('M131 251V279Q131 287 118 294Q96 303 111 308Q127 314 146 306Q151 300 139 298H118',w=5)
for y in [239,243,247]:b+=f'<ellipse cx="128" cy="{y}" rx="35" ry="5" fill="white" stroke="#252440" stroke-width="1.4"/>'
# Lưới kẻ đều được cắt trong tứ giác gốc.
b+=path('M55 164H238L202 238H18Z','white')+'<g clip-path="url(#mesh)">'
for x in range(27,236,8):b+=path(f'M{x} 162V240',w=1.3)
for y in range(164,237,8):b+=path(f'M16 {y}H240',w=1.3)
b+='</g>'+path('M55 164H238L202 238H18Z')
b+=path('M51 239L42 284M102 239L88 328M203 239L215 286',w=2.5)
# Bát che phần lưới phía sau; que khuấy ở trước.
b+=path('M60 157Q69 202 128 208Q187 202 198 157Z','white')+'<ellipse cx="129" cy="157" rx="69" ry="25" fill="white" stroke="#252440" stroke-width="1.5"/><ellipse cx="129" cy="196" rx="36" ry="11" fill="#ededed" stroke="#252440" stroke-width="1.5"/>'+path('M124 184L179 6',stroke='#929292',w=5)
b+=path('M111 190L133 191M111 194H124M130 195H139M115 198H126M123 200H133M129 202H141M115 203H127',w=1.5)
b+=path('M183 51C111 51 115 75 169 77M134 54L137 57',w=1.5)+path('M169 74L183 77L169 80Z','white',w=1.5)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="260" height="345" viewBox="0 0 260 345"><title>Bát sứ khuấy trên lưới theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bat-su-khuay-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=25,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',khongCoChu=True,hashPhong='88d88b3e2aae20fcc12d3f86a20e687448dabea032d3d2a04c03f352b5b5909c',trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Bowl2ellipses/rodgray/stircurvearrow/meshclip/3legs/spiritlampwick-liquidpattern/0text/khôngthêmflame/labels/particlescount.');(K/'cau-truc-bat-su-khuay-ddh-lo-188-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
