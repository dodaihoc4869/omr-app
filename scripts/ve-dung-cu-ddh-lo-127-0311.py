"""Dựng đường bao rõ; ROI mờ giữ từng pixel bằng path màu, tuyệt đối không suy số vạch/hạt."""
from pathlib import Path
import json,hashlib,importlib.util
from PIL import Image
from collections import defaultdict
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';SRC=G/'docs/hinh-vector-0311/nguon';a={r['i']:r for r in json.loads((M/'doc-lab-icons-lo-125.json').read_text())};rows=[];proof=[]
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
def path(d,w=.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def roi(r,box):
 im=Image.open(SRC/r['fileNguon']).convert('RGB');x0,y0,x1,y1=box;colors=defaultdict(list)
 for y in range(y0,y1):
  x=x0
  while x<x1:
   color=im.getpixel((x,y));end=x+1
   while end<x1 and im.getpixel((end,y))==color:end+=1
   colors[color].append(f'M{x} {y}h{end-x}v1h-{end-x}Z');x=end
 result=''.join(f'<path fill="rgb({c[0]},{c[1]},{c[2]})" d="'+''.join(ds)+'"/>'for c,ds in sorted(colors.items()))
 proof.append(dict(i=r['i'],box=box,sourceHash=r['hash'],hashRgbRoi=hashlib.sha256(im.crop(box).tobytes()).hexdigest(),palette=len(colors),runCount=sum(map(len,colors.values())),method='RLEtừngpixelRGBthật bằngrect-path,khôngthreshold/quantize/blur/đoáncount;khôngimage/bitmapnhúng;phảisoátđộclập.'))
 return result
for i in[1166,59,752,1391]:
 r=a[i];b='';width,height=r['canvas']
 if i==1166:
  b='<ellipse cx="38" cy="10" rx="13" ry="4" fill="none" stroke="#252440" stroke-width=".8"/>'+path('M26 10Q38 6 49 10M26 12V23M51 12V23M26 23Q38 29 51 23')
  b+=path('M26 23C8 29 4 40 8 53C14 75 25 112 34 134Q38 138 44 134C53 108 65 65 69 49C73 38 64 29 51 23')
  b+=path('M34 135L27 137Q22 140 31 143L36 144M43 135H49L52 130Q60 130 60 139Q60 150 54 149L50 142M34 144L36 147L42 146L45 143M35 145V175L42 172V145')
 elif i==59:
  b='<ellipse cx="49" cy="17" rx="26" ry="6" fill="none" stroke="#252440" stroke-width=".8"/>'+path('M31 16Q49 12 66 17M25 20Q48 26 74 20M25 22V166M66 23V166M25 166Q1 172 8 177Q39 187 67 181Q96 177 87 171L67 166M25 165L20 170M66 166L71 171')
  b+=roi(r,(41,37,67,161))
 elif i==752:
  b='<ellipse cx="68" cy="11" rx="18" ry="5" fill="none" stroke="#252440" stroke-width=".8"/><ellipse cx="68" cy="10" rx="14" ry="2" fill="none" stroke="#252440" stroke-width=".6"/>'+path('M53 15L54 39M83 15L81 39M54 39Q68 45 81 39M54 40L8 160C5 171 34 178 69 177C104 178 133 173 128 160L81 40M29 167Q68 161 107 167')
  for p,q in r['graduations']['marksApprox']:b+=path(f'M{p[0]} {p[1]}L{q[0]} {q[1]}')
 else:
  b='<defs><clipPath id="clear"><path clip-rule="evenodd" d="M0 0H169V192H0ZM32 151V175H149V151Z"/></clipPath></defs><g clip-path="url(#clear)">'
  b+=path('M12 22C31 8 73 0 112 5Q154 8 162 22Q163 34 141 36Q73 44 25 29L18 28L11 30Q5 26 12 22M18 22C44 8 114 0 145 15Q164 25 139 29Q77 40 30 24Z')
  b+=path('M18 29L26 43L25 164Q41 177 76 179Q126 181 155 164V33M34 39Q90 54 145 40')
  for p,q,t in r['graduations']['curvedMarksApprox']:b+=path(f'M{p[0]} {p[1]}Q{q[0]} {q[1]} {t[0]} {t[1]}')
  b+='</g>'+roi(r,(32,151,149,175))
 # Đệm đủ lề cho đáy gốc sát mép, không cắt nét.
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{(width+20)*3}" height="{(height+20)*3}" viewBox="0 0 {width+20} {height+20}"><title>Dụng cụ theo hình nguồn</title><g transform="translate(10 8)">'+b+'</g></svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dung-cu-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Khôngchữsố/đơnvịchấtlỏngthêm.1166đủvan;752đúng3vạch.59graduationROI/1391grainROIgiữtoànbộpixelRGBbằngpath,KHÔNGsuyshorttick/particlecount,khôngthreshold/blur/quantize. BảnứngviênchỉĐạtsausaotừngsource/render/ROI.'))
(M/'cau-truc-dung-cu-ddh-lo-127-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));(M/'giu-roi-nguon-lo-127.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2))
