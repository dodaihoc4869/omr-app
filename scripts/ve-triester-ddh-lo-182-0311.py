"""Nguồn1214: dựng theo từng đỉnh mạch nguồn, không suy tên acid."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='dc5ab4189af556323a11c8fea6473de14ec8d272e7eb1c8d16b4370da436b61d';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def poly(p):return line('M'+'L'.join(f'{x} {y}'for x,y in p))
b=line('M38 132V228L56 247M38 132L56 114M38 180H77M80 99L107 86M104 86V63M110 86V63')+F.label(67,113,'O',24)+F.label(107,59,'O',24)+F.label(90,187,'O',24)
b+=line('M103 178L135 171M132 171V147M138 171V147')+F.label(135,143,'O',24)+F.label(66,267,'O',24)+line('M78 255L85 249M82 252V281M88 252V281')+F.label(85,305,'O',24)
top=[(107,86),(141,105),(173,86),(203,105),(233,86),(264,105),(292,86),(323,105),(350,86),(380,105),(409,86),(438,105),(466,86),(495,105)]
mid=[(135,171),(165,187),(194,169),(222,187),(249,169),(277,187),(303,171),(329,171),(353,187),(381,169),(409,187),(437,169),(465,187)]
bot=[(85,249),(110,239),(140,258),(170,239),(199,258),(229,239),(258,258),(287,239),(317,258),(345,239),(375,258),(404,239),(434,258),(464,239),(493,258)]
b+=poly(top)+poly(mid)+line('M304 178H328')+poly(bot)+F.label(285,318,'(X)',25,weight='dam')
b+=F.label(503,187,'+ 3NaOH',24,'start')+line('M617 176H684')+'<path d="M684 176L667 170L667 182Z" fill="#252440"/>'+F.label(648,160,'t°',21)
b+=line('M712 112L703 139L716 170L705 210L713 236M716 170H746')+F.label(721,104,'OH',24)+F.label(766,179,'OH',24)+F.label(722,256,'OH',24)+F.label(724,299,'(Y)',25,weight='dam')+F.label(814,181,'+',25)
z=[(844,117),(864,101),(884,117),(905,101),(925,117),(946,101),(967,117),(988,101),(1009,117),(1030,101),(1050,117),(1071,101),(1092,117),(1108,109)]
t=[(838,235),(859,218),(881,235),(904,218),(926,235),(948,218),(970,231),(974,220),(996,220),(1017,235),(1039,218),(1061,235),(1082,218),(1103,235),(1115,227)]
b+=F.label(822,122,'2',24)+poly(z)+F.label(1116,118,'COONa',24,'start')+F.label(995,162,'(Z)',25,weight='dam')+poly(t)+line('M975 226H994')+F.label(1120,234,'COONa',24,'start')+F.label(994,292,'(T)',25,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1250" height="355" viewBox="0 0 1250 355"><title>Thủy phân triester theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='triester-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=1214,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,polylines=dict(top=top,mid=mid,bottom=bot,Z=z,T=t));(K/'cau-truc-triester-ddh-lo-182-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
