"""Monolaurate nguồn1404: chữ chuỗi ngưng tụ và từng nhánh theo native."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='fc85392ea0ab06e99f9b2d7e7795be5755a675560a4d88dfa7751d4bb27dc6a0';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
def line(d,w=1.3):
 global b
 cap='butt' if w==5 else 'round'
 b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="{cap}"/>'
def label(x,y,t,size=25,anchor='middle'):
 global b
 b+=F.label(x,y,t,size,anchor=anchor)
def oh(cx,y,reverse=False):
 text='HO' if reverse else 'OH';start=cx-F.advance('O',25)/2-(F.advance('H',25) if reverse else 0);label(start,y,text,anchor='start')
def taper(tip,foot):
 global b
 x,y=foot;b+=f'<path d="M{tip[0]} {tip[1]}L{x} {y-2.5}V{y+2.5}Z" fill="#252440"/>'
# Chuỗi ngưng tụ: không mở rộng thành zigzag, chỉ số nhỏ bằng glyph DDH.
parts=[('H',20.5,0),('3',14.35,4),('C(H',20.5,0),('2',14.35,4),('C)',20.5,0),('9',14.35,4),('H',20.5,0),('2',14.35,4),('C',20.5,0)]
x=4
for text,size,dy in parts:label(x,72+dy,text,size,anchor='start');x+=F.advance(text,size)
# Nhãn cuối C được nối bằng khoảng cách theo advance thực.
line(f'M{x+2:.3f} 58L162 49L178 58 M159 50.6V30 M165 50.7V30 M199 65L220 70V96H251 M220 96L199 123V155 M270 105L283 122L302 149 M315 149L333 123L363 106 M384 106L414 123V158L429 169 M333 123V96L320 88 M220 149V132 M261 149V174 M349 154V180 M400 154V141')
line('M220 149H261 M349 154H400',5)
for a,z in [((199,123),(220,149)),((283,122),(261,149)),((333,123),(349,154)),((414,123),(400,154))]:taper(a,z)
for ox,y in [(162,28),(188.5,73),(261.5,105),(373.5,110),(308.5,168)]:label(ox,y,'O')
oh(199,176,True);oh(220,130);oh(261,196);oh(308,95,True);oh(349,202);oh(400,139,True);oh(440,185)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="471" height="213" viewBox="0 0 471 213"><title>Cấu tạo theo nguồn1404</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='monolaurate-native1404-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1404,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='24C12O/7OH-HO/6member5member/4TAPER2boldfront-verticalfeet/3bareterminalC-NOCH2text/0standaloneH/EXACTH3C(H2C)9H2Csubscripts-lastCanchor/COdouble2splitfeet-noaddedbridge/regularupright/noaddedH-CH3-nums-caption-answer/noalias253')
(K/'cau-truc-monolaurate-native1404-ddh-lo-324-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw),'chainend',x)
