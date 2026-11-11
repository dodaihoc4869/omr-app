"""Sơ đồ hồ tinh bột nguồn693: giữ nguyên nhãn và hướng mũi tên của nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='807eea795fe28a1ca601d075e7ac4c22342922725bf7bc660490a1245b21307c';b=''
def rect(x,y,w,z,fill,stroke='none'):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{z}" rx="12" fill="{fill}" stroke="{stroke}" stroke-width="1.7"/>'
for x,y,w,z in [(9,18,140,63),(340,19,141,63),(670,20,140,63),(673,270,141,63),(348,271,141,63),(83,272,155,62)]:b+=rect(x+7,y+7,w,z,'#bfbfbf')
# Nét và đầu đặc nằm giữa các hộp; không đổi chiều theo phản ứng suy ra.
for x,y,u,v in [(149,49,337,49),(481,49,667,49),(741,83,741,267),(673,301,492,301),(344,302,241,302)]:
 b+=f'<path d="M{x} {y}L{u} {v}" stroke="#000" stroke-width="1.7" fill="none"/>'
 if u>x:pts=f'{u},{v} {u-18},{v-4} {u-18},{v+4}'
 elif u<x:pts=f'{u},{v} {u+18},{v-4} {u+18},{v+4}'
 else:pts=f'{u},{v} {u-4},{v-18} {u+4},{v-18}'
 b+=f'<polygon points="{pts}" fill="#000"/>'
for x,y,w,z in [(9,18,140,63),(340,19,141,63),(670,20,140,63),(673,270,141,63),(348,271,141,63),(83,272,155,62)]:b+=rect(x,y,w,z,'white','#000')
def label(x,y,t,z=20):return F.label(x,y,t,z,fill='#000')
b+=label(79,41,'Dung dịch')+label(79,68,'hồ tinh bột')+label(410.5,56,'Dung dịch X')+label(740,57,'Màu xanh tím')
b+=label(743.5,292,'Dung dịch')+label(743.5,318,'màu vàng')+label(418.5,309,'Dung dịch T')+label(160.5,309,'Kết tủa đỏ gạch',18.5)
def condition(x,y,t):
 z=20;small=13;w=F.advance(t,z)+F.advance('0',small);left=x-w/2
 return F.label(left,y,t,z,anchor='start',fill='#000')+F.label(left+F.advance(t,z),y-7,'0',small,anchor='start',fill='#000')
b+=condition(236,40,'dd HCl 1 M, t')+label(236,72,'(1)')+label(567,43,'2 mL dung dịch Y')+label(567,69,'(2)')
b+=label(594,291,'dung dịch NaOH',18.5)+condition(296,293,'+ Z, t')
b+='<g transform="translate(720 88) rotate(90)">'+F.label(0,0,'Thêm 5 mL dd Y',20,anchor='start',fill='#000')+'</g>'
b+='<g transform="translate(747 117) rotate(90)">'+F.label(0,0,'chờ 5 phút',20,anchor='start',fill='#000')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="829" height="346" viewBox="0 0 829 346"><title>Sơ đồ thí nghiệm theo nguồn693</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ho-tinh-bot693-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=693,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='6whiteROUNDboxes6grayRIGHTDOWNshadows/5FILLEDheads2RIGHT1DOWN2LEFT/ALLregularUPRIGHT/2verticalROT90labelsEXACTThêm5mLddY-chờ5phút/2SUP0/2stepnums/EXACTX-Y-Z-T-ddHCl1M-2mL-dungdịchNaOH-Kếttủađỏgạch/0extraheads/noX-Y-Zanswers-newconditions')
(K/'cau-truc-ho-tinh-bot693-native-ddh-lo-362-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
