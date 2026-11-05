"""Nguồn64: hai dạng maltose literal, không thêm nguyên tử/chú thích."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='0c76fb96a3ea6ed26b904baa727b6a9780ce40554edee5c88dc43f4f05dc37db';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t='OH',size=23):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def taper(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return f'<path d="M{x} {y}L{u+nx*3.3} {v+ny*3.3}L{u-nx*3.3} {v-ny*3.3}Z" fill="#252440"/>'
def ring(dx,dy,bridge=False):
 lx=77+dx+(10 if bridge else 0);ly=151+dy+(5 if bridge else 0);rx=244+dx+(8 if bridge else 0);ry=158+dy+(4 if bridge else 0)
 mx=120+dx+(8 if bridge else 0);my=177+dy+(5 if bridge else 0);nx=198+dx+(9 if bridge else 0)
 b=line(f'M{lx} {ly}L{124+dx} {119+dy}H{191+dx} M{215+dx} {130+dy}L{rx} {ry}')+F.label(204+dx,127+dy,'O',23)
 b+=taper((lx,ly),(mx,my))+line(f'M{mx} {my}H{nx}',6)+taper((rx,ry),(nx,my))
 b+=line(f'M{77+dx} {151+dy} M{mx} {my}V{148+dy+(0 if bridge else 8)} M{nx} {my}V{206+dy} M{124+dx} {119+dy}V{85+dy}L{147+dx} {71+dy}')
 if not bridge:b+=line(f'M{77+dx} {151+dy}V{179+dy}')
 b+=('' if bridge else first(77+dx,201+dy))+first(mx,141+dy+(0 if bridge else 8))+first(nx,226+dy)+first(159+dx,71+dy)
 return b
b=ring(0,0)+ring(217,2,True)+ring(540,15)
# Liên kết nối qua O, cùng các OH đầu khử của dạng vòng.
b+=line('M244 158L263 177M284 177L304 158M469 164V191')+F.label(274,195,'O',23)+first(469,213)
b+=line('M784 173L803 191M825 191L844 174')+F.label(814,209,'O',23)
# Dạng mở: các carbon ở góc mạch là carbon ẩn theo nguồn; aldehyde giữ H tường minh.
b+=line('M844 174L881 135H910M881 135V105L906 89M886 197V166M964 197V226M1010 180L1017 150M1004 179L1011 149M1010 180L1034 193')
b+=taper((844,174),(886,197))+line('M886 197H964',6)+taper((1010,180),(964,197))
b+=first(925,143)+first(924,87)+first(886,161)+first(964,246)+F.label(1021,145,'O',23)+F.label(1047,208,'H',23)
b+=F.label(289,274,'(I)',25,weight='dam')+F.label(857,270,'(II)',25,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1101" height="321" viewBox="0 0 1101 321"><title>Hai dạng cấu tạo theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='maltose-hai-dang-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=64,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='PanelI2rings/panelII1ring+openchain/2bridges/terminalimplicitC-OH/aldehydeHexplicit/8tapers4horizontalbold/(I)(II)truebold/DDHpath.');(K/'cau-truc-maltose-hai-dang-ddh-lo-200-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
