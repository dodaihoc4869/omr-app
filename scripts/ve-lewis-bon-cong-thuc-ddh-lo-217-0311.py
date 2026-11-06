"""Nguồn197: giữ nguyên các công thức Lewis, không sửa phương án theo quy tắc octet."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='215ff8d1773c9fa7dfb4e3694af4cae56acc9582d7b99ca3be07ad76aac66efc';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.8" stroke-linecap="round"/>'
def atom(x,y,t):return F.label(x,y,t,24)
b=''
for x,y,t in [(28,58,'N'),(67,58,'N'),(166,58,'O'),(206,58,'N'),(246,58,'O'),(367,40,'H'),(407,40,'N'),(447,40,'H'),(407,82,'H'),(576,31,'O'),(573,67,'N'),(534,83,'O'),(611,79,'O'),(649,72,'H')]:b+=atom(x,y,t)
for d in ['M40 46H54M40 50H54M40 54H54','M179 46H193M179 51H193M219 50H232','M381 32H394M420 32H433M407 46V58','M572 36V48M577 36V48M558 62L547 68M587 63L598 68M625 69L635 64']:b+=path(d)
dots=[(14,46),(14,54),(81,46),(81,54),(162,37),(170,37),(162,62),(170,62),(206,37),(242,37),(250,37),(258,46),(258,54),(242,62),(250,62),(403,18),(411,18),(561,20),(561,27),(590,20),(590,27),(522,64),(519,71),(519,82),(526,88),(540,88),(548,83),(607,59),(615,59),(607,83),(615,83)]
for x,y in dots:b+=f'<circle cx="{x}" cy="{y}" r="1.65" fill="#252440"/>'
for x,t in [(42,'(1)'),(206,'(2)'),(410,'(3)'),(588,'(4)')]:b+=F.label(x,118,t,24,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="669" height="131" viewBox="0 0 669 131"><title>Bốn công thức Lewis theo đề</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='lewis-bon-cong-thuc-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=197,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4formulas/31electrondots/4numberlabelsdamthật/allatoms-bondsliteral/nochargesadded/noanswer/DDHpath.')
(K/'cau-truc-lewis-bon-cong-thuc-ddh-lo-217-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
