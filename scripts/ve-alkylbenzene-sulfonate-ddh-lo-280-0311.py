"""Nguồn924: ba vòng có đường tròn thơm; giữ chất X chưa xác định và SO3Na thu gọn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a7ad4e09cc3eaff56f4245043026d96170dab645e7c65c050232f7786af5e370';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
b=''
for points,cx,cy in [([(74,64),(103,15),(154,16),(183,67),(153,116),(102,115)],128,65), ([(399,68),(428,19),(480,20),(508,71),(479,121),(427,119)],454,69), ([(777,70),(804,22),(861,23),(888,74),(859,124),(805,122)],833,73)]:
 b+=line('M'+'L'.join(f'{x} {y}'for x,y in points)+'Z')+f'<circle cx="{cx}" cy="{cy}" r="39" fill="none" stroke="#252440" stroke-width="1.8"/>'
b+=line('M34 64H74 M353 68H399 M508 71H554 M736 70H777 M888 74H924')
for x,y,t in [(11,75,'R'),(330,77,'R'),(713,79,'R'),(558,76,'SO₃H'),(929,78,'SO₃Na')]:b+=F.label(x,y,t,23,'start')
b+=line('M197 65H307 M628 69H694',2)+'<path d="M299 60L315 65L299 70Z M686 64L702 69L686 74Z" fill="#252440"/>'
b+=F.label(254,53,'H₂SO₄ đặc',21)+F.label(254,91,'t°',22)+F.label(657,55,'X',23)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1009" height="136" viewBox="0 0 1009 136"><title>Sơ đồ alkylbenzene sulfonate theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='alkylbenzene-sulfonate-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=924,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3hexagons3INNERcirclesnot3doubles/3Rlabels/2RIGHTfilledheads/H2SO4đặcabove-t°below/Xabove2/SO3H→SO3Naallsub3/noaddedionrewrite-Rvalue-caption-answerX.')
(K/'cau-truc-alkylbenzene-sulfonate-ddh-lo-280-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
