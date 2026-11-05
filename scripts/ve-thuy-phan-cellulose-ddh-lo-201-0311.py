"""Nguồn65: ba bước thủy phân, vẽ theo ảnh và giữ toàn bộ nhãn/caption."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='0c9ac40930023c578717a5301c9151b16ee54b44ac31b1cb2cad629e5c659c9b';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());a=next(x for x in iv['assets'] if x['hash']==h);r=dict(a,i=65);r['questions']=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:r['questions'].append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.7,fill='none',stroke='#252440'):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>'
def label(x,y,t,z=22,a='middle',weight='de'):return F.label(x,y,t,z,a,weight=weight)
def mixed(x,y,parts,z=22):
 b=''
 for t,sub,weight in parts:
  size=z*.66 if sub else z;b+=F.label(x,y+5 if sub else y,t,size,'start',weight=weight);x+=F.advance(t,size,weight=weight)
 return b
b=''
# Mặt thoáng, thành cốc hở và vân dung dịch nằm trong đường bao.
segments=[(3,3,14),(21,4,33),(51,3,70),(82,3,99),(4,9,17),(26,11,42),(49,9,64),(78,10,91),(7,20,26),(54,20,75),(82,22,99),(1,28,13),(20,30,32),(41,29,62),(82,31,98),(4,39,18),(24,40,41),(63,39,83),(83,42,99),(7,48,28),(40,49,57),(69,48,89),(2,57,16),(27,57,43),(57,57,76),(83,58,101),(7,64,24),(48,64,68),(80,64,95)]
for n,x in enumerate([218,509,889]):
 b+=path(f'M{x} 226H{x+104}V283Q{x+104} 295 {x+92} 295H{x+12}Q{x} 295 {x} 283Z',1.3,'#dedede')
 b+=path(f'M{x} 172V283Q{x} 295 {x+12} 295H{x+92}Q{x+104} 295 {x+104} 283V180L{x+111} 172',2)
 for x1,dy,x2 in segments:b+=path(f'M{x+x1} {226+dy}H{x+x2}',.95,stroke='#606060')
# Đũa hai thành, bông và chuyển động khuấy; không biến vân dung dịch thành hạt.
b+=path('M268 261V36Q270 31 273 36V261',1.7,'#c4c4c4')
b+=path('M245 256Q244 251 253 252Q258 245 267 251Q274 247 282 251Q292 248 296 255Q302 258 301 264Q306 270 292 274Q283 280 272 275Q259 279 251 271Q241 270 245 256Z',1.5,'white')
b+=path('M253 258Q264 262 272 258M254 266Q266 271 277 268M279 256L290 258M282 266H296',1.3)
b+=path('M268 255V264Q270 268 273 264V255',1.7,'#c4c4c4')
b+=path('M241 140C253 119 291 128 299 140C306 155 268 168 246 155C239 151 238 146 241 140',1.3)
b+=path('M242 135L240 141L246 139M296 157L291 156L295 151',1.1,'#252440')
# Nhãn và đường dẫn, chữ X/Y đậm thật theo nguồn.
b+=label(286,105,'khuấy nhẹ',22,'start')+label(159,229,'bông',22,'end')+path('M165 230L254 257',1.3)
b+=label(151,278,'dung dịch',22,'end')+mixed(37,302,[('H',0,'de'),('2',1,'de'),('SO',0,'de'),('4',1,'de'),(' 70%',0,'de')])+path('M161 281L238 286',1.3)
b+=label(725,215,'dung dịch')+label(725,240,'đồng nhất')+mixed(657,267,[('(dung dịch ',0,'de'),('X',0,'dam'),(')',0,'de')])+path('M662 239L573 265',1.3)
b+=mixed(1008,225,[('dung dịch ',0,'de'),('Y',0,'dam')])+path('M1042 238L951 264',1.3)
b+=label(268,348,'(a) Sơ đồ tiến hành')+label(268,374,'thí nghiệm')+label(563,350,'(b) Dung dịch thu được')+label(563,376,'sau khi thủy phân')+label(949,347,'(c) Trung hòa acid trong dung dịch')+mixed(769,373,[('sau khi thủy phân bằng NaHCO',0,'de'),('3',1,'de'),('.',0,'de')])
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1173" height="406" viewBox="0 0 1173 406"><title>Ba bước thí nghiệm theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='thuy-phan-cellulose-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),fileNguon=r.pop('file'),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='3beakers/openmouth/liquidtexture/rod/cotton/2stirarrowheads/4leaders/alllabels/3captions/H2SO470%/X-Ytruebold/NaHCO3/DDHpath.');(K/'cau-truc-thuy-phan-cellulose-ddh-lo-201-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
