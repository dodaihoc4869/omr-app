"""Nguồn440: hai trạng thái điện di; vệt phẳng, giữ nguyên các chữ công khai."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='4f91263c51177ac0240802a4b6c533d5e563694ebaa9450696c072b546c353be';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def rect(x,y,w,he,fill='none',stroke='#252440',sw=2):return f'<rect x="{x}" y="{y}" width="{w}" height="{he}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def dot(x,y):return f'<circle cx="{x}" cy="{y}" r="8" fill="#777777" stroke="#252440" stroke-width="1.5"/>'
b=line('M307 71H176C94 71 91 202 177 202H242M467 71H596C681 71 687 202 596 202H534M1045 64H905C824 64 823 188 906 188H977M1209 64H1348C1433 64 1430 188 1349 188H1278')
b+=rect(317,36,141,71,'white')+rect(1053,30,147,67,'white')+rect(214,125,348,155)+rect(948,114,358,148)
b+=line('M242 153V251M534 153V251M977 142V235M1278 142V235',1.5)
for x,y in [(307,71),(467,71),(1045,64),(1209,64)]:b+=dot(x,y)
for x,y,w,he in [(383,154,15,94),(1047,142,15,88),(1122,142,15,88),(1197,142,15,88)]:b+=rect(x,y,w,he,'#999999','none',0)
b+=line('M399 218L622 288M1040 235L978 296M1127 237V296M1212 238L1279 296',1.5)
b+=F.label(25,144,'Ban đầu',19.3,'start')+F.label(761,132,'Kết thúc',17.5,'start')
b+=F.label(388,82,'Nguồn điện',20)+F.label(1127,72,'Nguồn điện',20)
for x,y,t in [(305,56,'−'),(468,55,'+'),(1043,48,'−'),(1209,46,'+'),(228,171,'−'),(548,171,'+'),(963,158,'−'),(1292,158,'+')]:b+=F.label(x,y,t,22)
for x,y,t,a in [(221,149,'cathode','start'),(559,149,'anode','end'),(955,137,'cathode','start'),(1298,137,'anode','end')]:b+=F.label(x,y,t,20,a)
b+=F.label(394,273,'Môi trường có pH = 6',20)+F.label(517,319,'Vệt có chứa Ala, Lys, Glu',20,'start')
for x,t in [(965,'(1)'),(1127,'(2)'),(1281,'(3)')]:b+=F.label(x,319,t,20)
# Dấu in rất nhỏ, tách khỏi sơ đồ, được giữ tại vị trí nguồn thay vì tự bỏ.
b+='<path d="M143 44L145 41L147 44Z" fill="#252440"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1439" height="350" viewBox="0 0 1439 350"><title>Điện di ban đầu và kết thúc theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dien-di-hai-panel-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=440,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2panels/1+3flatgraybands/2sourceboxesminusLEFTplusRIGHT/4terminals/4electrodes/4leaders/cathode-anode/8chargeglyphs/pH6/allliteralcaptionsNOchất-period/retainminutemark/noaddedanswer/DDHpath.')
(K/'cau-truc-dien-di-hai-panel-ddh-lo-231-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
