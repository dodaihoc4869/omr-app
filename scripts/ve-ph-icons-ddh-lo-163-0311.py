"""Bảng pH nguồn1259, giữ 15 biểu tượng và nhãn literal, nét hình dựng thủ công."""
from pathlib import Path
import importlib.util,json,hashlib
from PIL import Image
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-chi-tiet-con-lai-lo-155.json').read_text())if r['i']==1259);q=r['geometry155'];im=Image.open(G/'docs/hinh-vector-0311/nguon/anh'/f"{r['hash']}.png").convert('RGB')
icons={
0:'<rect x="-34" y="-13" width="64" height="26" rx="2" fill="#fafafa"/><path d="M30 -6h4v12h-4M-27 0h5M21 -4v8m-4 -4h8" stroke="#252440" fill="none"/>',
1:'<path d="M-5 -34Q-8 -21 4 -18Q16 -24 24 -14Q39 11 14 24Q-9 40 -23 20L-17 12Q-7 25 4 10Q20 -5 1 -13Q-10 -15 -10 -32Z" fill="#f6aa82" stroke="#b95541"/><path d="M-1 -13Q12 -10 8 3Q0 14 -10 15M-20 20l-5 8m6 -4l-5 5" stroke="#fff" fill="none"/>',
2:'<ellipse rx="33" ry="37" transform="rotate(-35)" fill="#f2a334" stroke="#dc8630"/><path d="M-23 -22Q9 -39 30 -7Q16 24 7 29Z" fill="#ffdf63" stroke="#fff1ae" stroke-width="3"/><path d="M-16 -20L22 -8L6 24M-6 -24L9 19M8 -23L6 17" stroke="#fff4be" fill="none"/>',
3:'<path d="M-7 -40H7V-20Q16 -11 15 0V34Q0 39 -15 34V0Q-16 -11 -7 -20Z" fill="#f3efc5" stroke="#92966c"/><path d="M-8 -40H8v7H-8Z" fill="#84a17b"/><rect x="-11" y="-5" width="22" height="30" rx="4" fill="#fff" stroke="#777"/><path d="M-7 21Q0 7 7 21Q0 31 -7 21Z" fill="#4d6939"/>',
4:'<path d="M-24 -12Q-7 -25 1 -16Q18 -27 28 -9Q39 20 12 28Q-24 37 -29 14Z" fill="#ee7250" stroke="#3b234b" stroke-width="2"/><path d="M-6 -16L1 -25L7 -16L18 -22L10 -12M1 -25L1 -33" fill="none" stroke="#3b234b" stroke-width="2"/><path d="M-22 5Q-20 -9 -8 -11" stroke="#ffb48b" stroke-width="4" fill="none"/>',
5:'<path d="M-25 -22H25L18 30Q0 38 -18 30Z" fill="#fff" stroke="#aaa"/><path d="M-21 -7H21L17 24Q0 30 -17 24Z" fill="#72604f"/><ellipse cy="-23" rx="27" ry="9" fill="#eee" stroke="#aaa"/><ellipse cy="-24" rx="22" ry="5" fill="#fff" stroke="#bbb"/>',
6:'<path d="M-5 -29H5V-23Q15 -13 14 0V32Q0 37 -14 32V0Q-15 -13 -5 -23Z" fill="#faf7dc" stroke="#bbc4a0"/><path d="M-7 -31H7v5H-7Z" fill="#914a62"/><path d="M-7 -15V28" stroke="#fff" stroke-width="4"/>',
7:'<path d="M-33 10Q-18 2 -10 13Q5 24 28 9Q10 37 -19 24ZM-30 5Q-14 -6 -4 7Q8 17 31 6M-12 10L-20 -7M-5 6L-1 -10M9 11L22 -4M-31 -3l-7 -5M27 -9l6 -4" fill="none" stroke="#b5e3d6" stroke-width="2"/><ellipse cy="21" rx="29" ry="5" fill="none" stroke="#d7f0dc"/>',
8:'<path d="M-7 -34H7V31Q0 43 -7 31Z" fill="#76bfca" stroke="#12274b" stroke-width="2"/><path d="M-5 5H5V30Q0 37 -5 30Z" fill="#a9072b"/><path d="M-9 -36H9v6H-9Z" fill="#c77755" stroke="#6b4f58"/><path d="M-3 -23V1M-3 12V28" stroke="#e4e7d4"/>',
9:'<path d="M-27 -23H27L20 29Q0 36 -20 29Z" fill="#fff" stroke="#bbc2c8" stroke-width="2"/><path d="M-30 -23Q0 -41 30 -23L24 -17H-25Z" fill="#e2c2c3" stroke="#a6a6b2"/><path d="M-22 17Q0 23 22 17M-15 -15V14" stroke="#d1d2d1" fill="none"/>',
10:'<path d="M-9 -36Q-16 -16 -2 -9Q28 -26 36 -2Q47 28 12 35Q-9 39 -28 29L-23 18Q-10 25 -3 9Q0 2 -7 1Q-22 -5 -17 -34Z" fill="#e8a08a" stroke="#eec5bd" stroke-width="2"/><ellipse cx="17" cy="17" rx="9" ry="6" fill="#fff" stroke="#615c8c"/><path d="M13 17h8" stroke="#9087a9"/>',
11:'<path d="M-6 -36H6V-12L26 27Q28 34 18 34H-20Q-30 32 -24 23L-6 -12Z" fill="#d5ecde" stroke="#111e3e" stroke-width="2"/><path d="M-13 0H13L23 26Q0 30 -23 26Z" fill="#70beb0"/><path d="M-7 -38H7v6H-7Z" fill="#e2c3d7"/><path d="M0 -30V-15M-12 7L-17 18" stroke="#fff" stroke-width="3"/>',
12:'<path d="M-31 -8Q-30 -17 -18 -17H20Q31 -16 32 -7L27 12Q22 17 -20 15Q-34 13 -31 -8Z" fill="#dac3dc" stroke="#91769b" stroke-width="2"/><path d="M-26 -5H25M-22 2H18" stroke="#f9f0f7" fill="none"/><circle cx="-31" cy="13" r="5" fill="#fff"/><circle cx="27" cy="-13" r="5" fill="#fff"/><circle cx="34" cy="10" r="4" fill="#fff"/>',
13:'<path d="M-9 -32H12V-23L22 -18Q29 -3 25 30Q12 39 -17 34L-20 28V-15Q-21 -27 -9 -27Z" fill="#ded8ce" stroke="#b5a9b6" stroke-width="2"/><path d="M12 -23L20 -20L25 0L18 -1L15 -14Z" fill="#7c658d" stroke="#fff"/><path d="M-8 -34H11v7H-8Z" fill="#f5e7db"/><path d="M-10 -14V25M2 -15V26" stroke="#fff" stroke-width="3"/>',
14:'<path d="M-38 -1L18 -17L37 2L-17 25Z" fill="#aaa6ae" stroke="#292833" stroke-width="2"/><path d="M-29 1L16 -11L27 0L-15 17Z" fill="#dfdce0" stroke="#3b3744"/><path d="M-11 12Q-3 0 10 1Q13 8 -4 12Z" fill="#55515b"/><path d="M-7 -12V-21Q-2 -28 4 -18M4 -18L11 -21" fill="none" stroke="#39313e" stroke-width="2"/>'}
b='<g transform="translate(20 20) scale(1.5)" stroke-linejoin="round" stroke-linecap="round">'
for v in q['items']:
 ph=v['pH'];cx,cy,rr=v['iconCircle'];x1,y1,x2,y2=v['barCellApprox'];col=im.getpixel((int((x1+x2)/2),380));color='#%02x%02x%02x'%col
 b+=f'<path d="M{cx} {cy+rr}V315" stroke="{color}" stroke-width="3"/><circle cx="{cx}" cy="{cy}" r="47" fill="{color}" stroke="{color}" stroke-width="2"/><rect x="{x1}" y="315" width="{x2-x1-3}" height="76" fill="{color}" stroke="{color}"/>'
 b+=f'<g transform="translate({cx} {cy})" stroke-width="1.2">{icons[ph]}</g>'+F.label(cx,369,str(ph),33,fill='#fff')
 override=q['labelLineOverrides'].get(str(ph))
 if override:
  for t,(xx,yy) in override:b+=F.label(xx,yy,t,16)
 else:b+=F.label(*v['labelAnchor'],v['label'],16)
b+='</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1530" height="670" viewBox="0 0 1530 670"><title>Bảng pH và các biểu tượng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ph-icons-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='15cells0..14/15iconsmanual/2rowanchors/EnglishCoffee-BakingSoda/literalpHvalues;khôngsửatheory,tấtcảlabelsDDHpath,kýhiệuchailọkhôngthêmbộchữkhôngđọcđược.')
(M/'cau-truc-ph-icons-ddh-lo-163-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
