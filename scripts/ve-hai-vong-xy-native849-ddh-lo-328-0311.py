"""Hai vòng Haworth nguồn849: giữ nguyên X/Y, không điền đáp án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9bd690ef987009dd9a9d47dca42ca87459e3077bf4a3e924cd121795da822d60';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
def line(d,w=2):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="'+('butt'if w==8 else'round')+'" stroke-linejoin="round"/>'
def label(x,y,t,size=31,anchor='middle'):
 global b
 b+=F.label(x,y,t,size,anchor=anchor)
def oh(x,y):
 label(x-F.advance('O',31)/2,y,'OH',anchor='start')
def taper(tip,foot):
 global b
 x,y=foot;b+=f'<path d="M{tip[0]} {tip[1]}L{x} {y-4}V{y+4}Z" fill="#252440"/>'
line('M49 124L96 85H151 M96 85V56 M178 95L214 124L238 143 M49 124V156 M96 159V135 M167 162V194 M263 143L286 124L333 85H388 M333 85V56 M416 95L452 124V156 M333 159V135 M404 162V194')
line('M96 161H167 M333 161H404',8)
for t,f in [((49,124),(96,161)),((214,124),(167,161)),((286,124),(333,161)),((452,124),(404,161))]:taper(t,f)
for x,y in [(166,96),(250,164),(404,96)]:label(x,y,'O')
for x,y in [(49,183),(96,129),(167,219),(333,129),(404,219)]:oh(x,y)
label(333,50,'X');label(452,183,'Y')
x=85
for t,sz,dy in [('CH',31,0),('2',21.7,6),('OH',31,0)]:label(x,50+dy,t,sz,anchor='start');x+=F.advance(t,sz)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="492" height="250" viewBox="0 0 492 250"><title>Hai vòng với X và Y theo nguồn849</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hai-vong-xy-native849-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=849,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2sixrings10bareC+CH2OH-C/9O/5freeOH+CH2OH-O/4TAPER2boldfront-verticalfeet/CH2OHleftUP-XrightUP-YrightDOWN/0standaloneH/regularupright/noaddedH-CH2OH-X-Yanswer-nums-caption/noalias987')
(K/'cau-truc-hai-vong-xy-native849-ddh-lo-328-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
