"""Ba dụng cụ A–B–C theo ảnh nguồn; vạch, chất lỏng và khóa giữ riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ea64fde328eb1e3e1aa236a70008596fd69acaa8ae7a7765c89c9c683efbb23f';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M40 216H68V273Q68 289 54 294Q40 289 40 273Z M121 101Q125 105 132 105H200Q208 105 212 101V140Q212 158 195 158H137Q121 158 121 141Z M136 286H204L218 332Q220 343 202 354H140Q126 350 121 333Z" fill="#ebebeb"/>'
b+='<path d="M41 216H67 M121 101Q125 105 132 105H200Q208 105 212 101 M135 286H205" fill="none" stroke="#b4b4b4" stroke-width="1.3"/>'
b+='<path d="M37 33Q40 34 40 41V273Q40 289 54 294Q68 289 68 273V41Q68 34 71 33 M117 33Q121 34 121 42V140Q121 158 138 158H195Q212 158 212 140V42Q212 34 216 33 M146 197Q149 198 149 204V230L122 329Q118 342 138 354H202Q222 343 219 331L191 230V204Q191 198 195 197" fill="none" stroke="#292929" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"/>'
# Chỉ các vạch ngắn nhìn thấy: không thêm vạch tại mặt thoáng.
for y in [71,108,145,182,219,257]:b+=f'<path d="M54 {y}H63" stroke="#b5b5b5" stroke-width="1.4"/>'
for y in [47,65,84,121,140]:b+=f'<path d="M198 {y}H207" stroke="#b5b5b5" stroke-width="1.4"/>'
for y,x in [(243,178),(262,182),(280,187),(299,191),(318,195),(337,200)]:b+=f'<path d="M{x} {y}H{x+9}" stroke="#b5b5b5" stroke-width="1.4"/>'
# Khóa: thân trước, nhánh ngang và tay đứng bị thân che; hai mép vòi dưới.
b+='<path d="M50 327V362 M57 327V362" stroke="#292929" stroke-width="2.8"/>'
b+='<path d="M71 285Q74 282 77 285V303H80Q83 303 83 307V313Q83 317 79 317H77V334Q74 338 71 334V317H62V303H71Z" fill="#888888" stroke="#373737" stroke-width="2"/>'
b+='<path d="M64 306H81V312H64Z" fill="#d2d2d2"/><path d="M73 288V303 M73 318V331" stroke="#555555" stroke-width="1.5"/>'
b+='<path d="M43 294H64V318L59 330H48L43 318Z" fill="#858585" stroke="#3b3b3b" stroke-width="2"/><path d="M46 297H50V318L52 326H48L46 316Z" fill="#b6b6b6"/>'
for x,y,t in [(89,191,'A'),(166,85,'B'),(162,271,'C')]:b+=F.label(x,y,t,18,weight='dam',fill='#1b1b1b')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="252" height="395" viewBox="0 0 252 395"><title>Ba dụng cụ chuẩn độ</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ba-dung-cu-chuan-do-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1288,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3grayapparatusA-buretteB-beakerC-flask/6Aticks5Bticks6Cticks/3liquidfills/stopcock2edgesoutlet/3actualDAMlabels/noaddednums-volumes-drop-stand-answer')
(K/'cau-truc-ba-dung-cu-chuan-do-ddh-lo-301-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
