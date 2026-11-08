"""Nguồn967: bốn cấu trúc và ba bước theo bản in, giữ nguyên Cyclohexanon."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='adaa1e5e128ecce0cdd3e74adb785d631bf2c398293285107ca7db6d4c1c0440';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
b=line('M97 104L136 81L176 103V147L137 170L97 149Z M176 103L200 89 M369 102L406 80L447 102V147L409 168L369 146Z M447 98L471 84 M451 105L475 91 M716 88L678 68L635 87L624 132L651 168L696 169L716 147 M716 88L721 119 M716 84L741 70 M720 91L745 77 M998 134L1030 114 M1076 113L1103 129L1141 106L1185 127L1223 106L1265 127L1304 107L1355 128 M1300 107V71 M1308 107V71 M1030 58H1014V150H1030 M1323 53H1340V145H1323',3)
b+=line('M206 126H339 M467 123H598 M800 114H933',2.8)
b+='<path d="M330 120L348 126L330 132Z M590 117L608 123L590 129Z M924 108L943 114L924 120Z" fill="#252440"/>'
for x,y,t,z,anchor in [(205,90,'OH',28,'start'),(486,88,'O',29,'middle'),(756,78,'O',29,'middle'),(716,145,'NH',28,'start'),(1032,110,'NH',28,'start'),(1304,68,'O',29,'middle'),(1357,155,'n',24,'middle'),(278,113,'[O]',28,'middle'),(540,115,'+NH₂OH',27,'middle'),(882,103,'xt, t°',28,'middle'),(274,159,'(1)',28,'middle'),(540,158,'(2)',28,'middle'),(871,147,'(3)',28,'middle')]:b+=F.label(x,y,t,z,anchor,weight='dam')
for x,y,t in [(137,208,'Cyclohexanol'),(409,207,'Cyclohexanon'),(686,205,'Caprolactam'),(1182,189,'Tơ capron')]:b+=F.label(x,y,t,26,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1426" height="264" viewBox="0 0 1426 264"><title>Sơ đồ sản xuất tơ capron theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='san-xuat-capron-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=967,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4structures/6-6-7rings/5bareCH2polymer/3COdouble/3filledRIGHTheads/3stepnums/[O]/+NH2OH/xt,t°/squarepair+nsub/4actualdamcaptions/EXACTCyclohexanol-Cyclohexanon-Caprolactam-Tơcapron/noaddedoxime-H2O-condition-answer.')
(K/'cau-truc-san-xuat-capron-ddh-lo-283-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
