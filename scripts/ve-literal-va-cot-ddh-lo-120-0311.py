"""Giữ số liệu dinh dưỡng và công thức chữ khác thường đúng nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-117.json').read_text())};rows=[]
def line(x,y,xx,yy,w=3):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="{w}"/>'
def repeat(x,branch,small=False):
 c2,ch,right=(120,260,390)if small else(180,340,570)
 b=F.label(c2,125,'CH₂',40)+F.label(ch,125,'CH',40)+line(20,110,c2-45,110)+line(c2+45,110,ch-45,110)+line(ch+45,110,right+40,110)+line(ch,145,ch,185)+F.label(ch-F.advance('O',40)/2,230,branch,40,'start')
 b+=f'<path d="M70 20Q20 135 70 260M{right} 20Q{right+50} 135 {right} 260" fill="none" stroke="#252440" stroke-width="3"/>'+F.label(right+40,280,'n',34)
 return f'<g transform="translate({x} 0)">'+b+'</g>'
for i in[578,125,1155]:
 if i==578:
  w,h=1000,800;b=line(150,90,150,650)+line(150,650,930,650)
  for v,endx in[(19,250),(38,475),(17,700)]:
   y=650-v*12;b+=f'<path d="M150 {y}H{endx}" stroke="#686772" stroke-width="2" stroke-dasharray="7 6"/>'+F.label(135,y+9,str(v),29,'end')
  for x,v,name in[(250,19,'đạm'),(475,38,'béo'),(700,17,'bột')]:
   y=650-v*12;b+=f'<rect x="{x}" y="{y}" width="110" height="{650-y}" fill="#a4a4a4"/>'+F.label(x+55,y-66,'Chất',31)+F.label(x+55,y-28,name,31)
  b+=F.label(150,65,'kJ/g',32)+F.label(850,710,'Thức ăn',32)
 elif i==125:
  w,h=2300,410;b=repeat(20,'OOCCH₃')+F.label(330,350,'polymer X',40)+F.label(710,125,'+',40)+F.label(890,125,'nNaOH',40)+line(1050,110,1210,110)+'<path d="M1230 110L1208 102V118Z" fill="#252440"/>'+F.label(1140,70,'t⁰',33)+repeat(1300,'OH',True)+F.label(1795,125,'+',40)+F.label(1850,125,'nCH₃COONa',40,'start')
 else:
  w,h=1120,320;b=''
  for shift,ion in[(0,False),(650,True)]:
   q=F.label(65,100,'H₃N⁺'if ion else'H₂N',32)+line(100,115,142,158)+F.label(160,180,'R',32)+line(181,170,240,170)+line(238,168,264,111)+line(245,174,271,114)+F.label(280,95,'O',32)+line(240,170,264,225)
   q+=F.label(270-F.advance('O',32)/2,255,'O⁻'if ion else'OH',32,'start');b+=f'<g transform="translate({shift} 0)">'+q+'</g>'
  b+=line(350,160,500,160)+line(500,180,350,180)+'<path d="M500 160L487 154V166ZM350 180L363 174V186Z" fill="#252440"/>'
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Nội dung theo hình nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='literal-va-cot-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='578giữ19/38/17khônggộpđạm/bột;125giữOOCCH3chứKHÔNGOCOCH3/ngoặc/n/stubs;1155giữRởnútKHÔNGthêmCHalpha/chargesđúng.'))
(M/'cau-truc-literal-va-cot-ddh-lo-120-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
