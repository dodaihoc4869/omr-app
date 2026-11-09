"""Nguồn1073: hai hàng thủy phân, giữ dạng ion và OH đúng hình nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='c16ba6422acec34c6de1d4344f9fc1c9359254b75811cb1f2b38185fcec0ffc0';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.9):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=20,a='start'):return F.label(x,y,t,z,a,weight='dam')
b=''
for dx,dy,ester,acid in [(0,0,True,True),(422,0,True,False),(-2,173,True,False),(419,173,False,False)]:
 part=line('M65 18L28 40V84L65 106L103 84V41Z M65 25L97 44 M34 45V79 M65 99L97 80 M103 41L133 23')
 part+=label(137,26,'COOH'if acid else'COO⁻',19)
 if ester:
  part+=line('M103 84L125 97 M145 103H170 M170 103L191 79 M174 106L195 82 M170 103L184 123')
  part+=label(135,110,'O',20,'middle')+label(201,79,'O',20,'middle')+label(186,137,'CH₃',19)
 else:
  part+=line('M103 84L124 97');part+=label(128,110,'OH',20)
 b+=f'<g transform="translate({dx} {dy})">{part}</g>'
for y in [71,241]:
 b+=label(253,y+7,'+',20,'middle')+label(271,y+7,'OH⁻',20)
 b+=line(f'M336 {y}H413',2)
 b+=f'<polygon points="408,{y-5} 423,{y} 408,{y+5} 411,{y}" fill="#252440"/>'
b+=label(656,78,'+',20,'middle')+label(673,78,'H₂O',20)
b+=label(616,247,'+',20,'middle')+label(633,247,'CH₃COO⁻',19)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="724" height="332" viewBox="0 0 724 332"><title>Hai giai đoạn phản ứng aspirin theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='aspirin-hai-buoc-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1073,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2rows4phenyl12INNERdoubles/3esters3COdouble/COOH→3COOSUPminus/2OHminusreactants/2filledRIGHT/4plus/H2Otop+CH3COOminusbottom/phenOHbottomRIGHTliteral/ALLchemical-labelsactualdam/subs-supcharges/O-Canchors/noaddedNa-temperature-phenoxide-answer.')
(K/'cau-truc-aspirin-hai-buoc-ddh-lo-288-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
