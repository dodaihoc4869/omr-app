"""Nguồn151: ba dạng glucose với CHO thu gọn và hai ô OH, giữ nhãn thiếu chữ cuối."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1a852678d4df801d7ec70233c6a630c999bb3bf309669c8c9997b0784d36c241';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.8,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=25,a='middle'):return F.label(x,y,t,z,a)
def first(x,y,t,z=25):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=25):return F.label(x+F.advance(t[-1],z)/2,y,t,z,'end')
def taper(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return f'<path d="M{x} {y}L{u+nx*3.2} {v+ny*3.2}L{u-nx*3.2} {v-ny*3.2}Z" fill="#252440"/>'
def ring(dx=0,beta=False):
 b=f'<g transform="translate({dx} 0)">'+path('M64 171L122 129H194M220 141L266 171')+label(208,141,'O')+taper((64,171),(122,213))+path('M122 213H207',5.8)+taper((266,171),(207,213))
 b+=path('M122 129V109M122 129V146M64 171V149M64 171V199M122 213V199M122 213V240M207 213V198M207 213V240M266 171V150M266 171V196')
 b+=first(122,104,'CH₂OH')+label(122,167,'H')+label(64,145,'H')+first(64,225,'OH')+first(122,193,'OH')+label(122,266,'H')+label(207,193,'H')+first(207,266,'OH')
 b+=(first(266,145,'OH')+label(266,222,'H'))if beta else(label(266,145,'H')+first(266,222,'OH'))
 for x,y,t in [(277,179,'1'),(219,239,'2'),(133,238,'3'),(54,178,'4'),(112,131,'5'),(122,76,'6')]:b+=label(x,y,t,18)
 return b+'</g>'
b=ring()+ring(550,True)
b+=first(433,75,'CHO')+path('M433 82V229')+first(433,260,'CH₂OH')
for y,left,right in [(99,'H','OH'),(135,'HO','H'),(171,'H','OH'),(208,'H','OH')]:
 b+=path(f'M404 {y}H459')
 b+=(last(391,y+11,left)+label(474,y+11,right))if left=='HO'else(label(391,y+11,left)+first(474,y+11,right))
for x,y,t in [(433,46,'1'),(422,93,'2'),(422,130,'3'),(422,166,'4'),(422,202,'5'),(422,233,'6')]:b+=label(x,y,t,18)
for x,z in [(293,355),(523,586)]:
 b+=path(f'M{x} 166H{z}M{z} 173H{x}',1.4)+path(f'M{z-11} 162L{z} 166H{z-11}Z',.7,'#252440')+path(f'M{x+11} 177L{x} 173H{x+11}Z',.7,'#252440')
b+='<rect x="247" y="190" width="62" height="41" rx="6" fill="none" stroke="#252440" stroke-width="1.8" stroke-dasharray="1.6 3"/><rect x="795" y="112" width="62" height="41" rx="6" fill="none" stroke="#252440" stroke-width="1.8" stroke-dasharray="1.6 3"/>'
b+=label(333,294,'OH hemiacetal',24)+path('M303 267L285 235M285 235L294 240L288 244Z',1,'#252440')
# Nhãn trên trong ảnh chỉ in "OH hemiaceta", không tự thêm l còn thiếu.
b+=label(811,58,'OH hemiaceta',24)+path('M800 65L821 106M821 106L814 99L824 97Z',1,'#252440')
b+=label(151,312,'α-glucose',25)+label(477,318,'glucose',25)+label(733,312,'β-glucose',25)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="950" height="350" viewBox="0 0 950 350"><title>Ba dạng và các nhóm OH theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-hemiacetal-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=151,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='α-open-β/18Cnums/allH-OH/CHO-CH2OHcondensed/FischerRLRR/4TAPER2horizontalbold/2equilibriumpairs/3captions/2dottedOHboxes2leaders/bottomOHhemiacetal-topOHhemiacetaliteralNOl/DDHpath.');(K/'cau-truc-glucose-hemiacetal-ddh-lo-213-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
