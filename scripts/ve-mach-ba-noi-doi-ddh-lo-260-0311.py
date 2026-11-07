"""Nguồn739: ba nối đôi của đoạn mạch, giữ mọi nhóm CH2, CH3 và H in nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='0222514952c491c9343f2175ce749276ec03c0f4b5758e38bd3da9b6e24cdf01'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
for x,y,t in [(108,80,'CH₃'),(108,177,'CH₂'),(200,131,'C'),(271,131,'C'),(340,77,'H'),(350,179,'CH₂'),(445,126,'CH₂'),(511,180,'C'),(582,180,'C'),(438,243,'CH₃'),(645,242,'H'),(642,126,'CH₂'),(734,180,'CH₂'),(731,68,'CH₃'),(803,119,'C'),(888,119,'C'),(953,66,'H'),(965,180,'CH₂')]:b+=F.label(x,y,t,28)
b+='<path d="M49 168H82 M147 172L184 137 M143 83L182 115 M216 118H256 M216 125H256 M291 111L322 84 M295 128L330 153 M383 173L416 134 M472 130L500 164 M529 165H569 M529 172H569 M501 188L464 225 M599 185L629 219 M595 155L620 126 M674 120L706 150 M764 158L787 125 M760 72L790 100 M827 107H867 M827 114H867 M906 101L938 70 M902 125L937 154 M992 170H1027" fill="none" stroke="#252440" stroke-width="2.6" stroke-linejoin="round"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1076" height="295" viewBox="0 0 1076 295"><title>Đoạn mạch theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='mach-ba-noi-doi-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=739,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='15C=6explicitC+6CH2+3CH3/3explicitH/3CCdouble/CH3up-down-upHup-down-up/2freeends/noextra brackets-n-caption-answer.')
(K/'cau-truc-mach-ba-noi-doi-ddh-lo-260-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
