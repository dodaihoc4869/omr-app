"""Nguồn142: điện cực và khóa X theo hình, không thêm dấu cực hay hiện tượng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='191e393a1cdd66f1cd8111cf5aff22e40b6e54101839a1ee995034b4fe6c1577';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.8,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#606060" stroke-width="{w}" stroke-linejoin="round"/>'
b=path('M172 269H392V354Q392 380 367 380H197Q172 380 172 354Z',1.5,'#f6f6f0')+path('M172 163V354Q172 380 197 380H367Q392 380 392 354V163',2)
# Vân dung dịch nằm ngang theo bản in, không diễn giải là số hạt.
for y,segs in [(282,[(172,202),(236,248),(263,277),(291,305),(319,340),(373,391)]),(309,[(182,195),(236,250),(265,283),(296,316),(374,391)]),(336,[(177,201),(243,261),(289,310),(325,341),(376,391)]),(362,[(187,202),(224,239),(249,262),(274,291),(308,324),(358,391)])]:
 for x,z in segs:b+=path(f'M{x} {y}H{z}',1.7)
b+=path('M204 151H223V360H204Z M342 149H360V360H342Z',2,'white')
b+=path('M213 150C154 134 169 84 217 75C265 54 325 62 359 80C401 103 384 133 350 149',1.8)
b+='<circle cx="215" cy="75" r="8" fill="white" stroke="#606060" stroke-width="1.6"/>'+path('M209 70L221 80M209 80L221 70',1.4)
b+=F.label(144,29,'Khóa X',26,weight='dam')+F.label(222,133,'Zn',26)+F.label(329,130,'Cu',26)
b+=F.label(93,245,'dung dịch',24)+F.label(93,278,'H₂SO₄',24)+path('M108 285L186 320',1.4)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="440" height="421" viewBox="0 0 440 421"><title>Điện cực và khóa X theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='zn-cu-khoa-x-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=142,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Zn-Cu2electrodes/Ubeaker/horizontalliquidpattern/curvedwire/circlecrossswitch/KhóaX-dungdịchH2SO4/leader/nocharge-bubblesadded/DDHpath.');(K/'cau-truc-zn-cu-khoa-x-ddh-lo-211-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
