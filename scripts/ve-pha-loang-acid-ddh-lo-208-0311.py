"""Nguồn111: bốn hình rót và khuấy literal, không đánh dấu đáp án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='14f4d42f3e492158763ea1fdb96a998e805e6350610759d87ac34d9815a446f2';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.7,fill='none',stroke='#666666'):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>'
def label(x,y,t,z=20,a='middle',weight='de'):return F.label(x,y,t,z,a,weight=weight,fill='#252440')
b=''
# Cốc nhận để trống theo nét nguồn; không tự thêm mặt thoáng hoặc dòng chảy.
for x,y,w,hh in [(146,118,61,80),(672,121,62,80),(68,365,61,79),(687,378,62,79)]:
 b+=path(f'M{x-9} {y+1}L{x} {y}H{x+w}V{y+hh-5}Q{x+w} {y+hh} {x+w-5} {y+hh}H{x+5}Q{x} {y+hh} {x} {y+hh-5}V{y+8}L{x-9} {y+1}',1.7)
# Cốc nghiêng và mép rót; các vị trí giao nhau giữ đúng bố cục nguồn.
for d in ['M190 95L240 55L241 61L287 118Q290 123 286 127L247 154Q242 158 238 153L195 102H190Z','M718 99L767 60L769 66L813 121Q817 126 812 130L774 158Q768 163 764 158L724 106H718Z','M106 345L161 298L162 304L207 358Q211 362 207 366L168 396Q162 400 158 395L116 343Z','M731 355L782 314L783 321L827 375Q831 380 826 384L790 412Q784 416 780 411L736 361H731Z']:
 b+=path(d,1.7,'white')
# Chỉ hình1/2/4 có đũa, hai thành và đầu tròn.
for x,y,bt in [(187,53,198),(714,56,198),(729,315,453)]:
 b+=path(f'M{x-2} {bt}V{y+2}Q{x} {y-2} {x+2} {y+2}V{bt}Z',1.7,'#999999',stroke='#555555')
for x,y,t in [(179,24,'Hình 1'),(715,29,'Hình 2'),(130,285,'Hình 3'),(713,294,'Hình 4')]:b+=label(x,y,t,23,weight='dam')
b+=label(130,74,'Đũa thủy tinh',17,'end')+path('M136 69L184 85',1.3)+label(316,90,'H₂O',20,'start')+path('M313 86L265 118',1.3)+label(252,186,'H₂SO₄ đặc',20,'start')+path('M200 182H248',1.3)
b+=label(639,92,'Đũa thủy tinh',20,'end')+path('M647 89H711',1.3)+label(790,77,'H₂SO₄ đặc',20,'start')+path('M807 88L792 121',1.3)+label(627,189,'H₂O',20,'end')+path('M631 185H695',1.3)
b+=label(250,369,'H₂SO₄ đặc',20,'start')+path('M187 364H248',1.3)+label(175,433,'H₂O',20,'start')+path('M107 428H171',1.3)
b+=label(653,350,'Đũa thủy tinh',20,'end')+path('M662 343H726',1.3)+label(794,318,'H₂SO₄ đặc',20,'start')+path('M822 327L807 375',1.3)+label(643,447,'H₂O',20,'end')+path('M647 442H710',1.3)
b+=label(155,230,'Rót từ từ và khuấy nhẹ.',20)+label(700,233,'Rót từ từ và khuấy nhẹ.',20)+label(148,479,'Rót và không khuấy.',20)+label(679,480,'Rót mạnh và khuấy.',20)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="940" height="505" viewBox="0 0 940 505"><title>Bốn hình thí nghiệm theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pha-loang-acid-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=111,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4panels/4receiver4tiltedbeakers/3rodsONLY1-2-4/allleaders-labels/Hinh1..4truebold/4captionsliteral/noaddedliquids-flowlines-answer/DDHpath.');(K/'cau-truc-pha-loang-acid-ddh-lo-208-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
