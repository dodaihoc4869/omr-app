"""Nguồn769: maltose hai vòng, nhãn carbon xanh và OH đầu phải đỏ, không thêm đáp án."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='8f8b6e8f413d9801537cf2df719b5dc145eb37ea6a199c4c554186235e952292';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
BLACK='#252440';BLUE='#3376b5';RED='#ec2639';b='<g transform="translate(28 18)">'
def line(d,c=BLACK,w=2.6):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
# Khung sau mảnh; hai cạnh trước vát đều nở ở C2/C3; hai cạnh đáy đậm.
for dx,dy in [(0,0),(347,-3)]:
 b+=f'<g transform="translate({dx} {dy})">'
 b+=line('M27 180L87 119H157 M184 132L234 180')
 b+=f'<path d="M27 180L84 243L90 237Z M234 180L171 237L177 243Z" fill="{BLACK}"/>'
 b+=line('M87 240H174',w=6)
 b+=line(('M27 135V220 'if dx==0 else'M27 135V177 ')+ 'M87 88V146 M87 211V280 M174 202V276 M234 135V178')
 b+=F.label(27,130,'H',32)+F.label(87,170,'H',29)
 if dx==0:b+=F.label(27,250,'OH',32)
 b+=F.label(87,205,'OH',31)+F.label(87,310,'H',32)+F.label(174,198,'H',32)+F.label(174,307,'OH',32)
 b+=F.label(87-F.advance('C',32)/2,79,'CH₂OH',32,'start')+F.label(171,132,'O',32)+F.label(234,130,'H',32)
 nums=[(1,250,176),(2,191,262),(3,73,266),(4,13,190),(5,73,116),(6,87,53)]
 for n,x,y in nums:
  if dx and n==4:y=179  # nhãn4 nguồn nằm trên liên kết cầu, không chạm nét xanh
  b+=F.label(x,y,str(n),25,fill=BLUE)
 b+='</g>'
# O cầu và hai liên kết xanh, không có đầu mũi tên hóa học.
b+=line('M234 180L286 224 M315 224L374 177',BLUE)+F.label(300,239,'O',32,fill=BLUE)
# Nhánh OH hemiacetal phải; cạnh C4 nhánh cầu thay OH/H dưới nên không thêm nhánh mới.
b+=line('M581 178V225')+F.label(581+F.advance('H',32)/2,253,'OH',32,fill=RED)
# Tên liên kết và đầu V mở chỉ vào liên kết cầu trái.
b+=F.label(284,35,'Liên kết (x)',32,weight='dam')+line('M295 48L270 202',w=2)+line('M260 192L270 202L280 195',w=2)
y=351;b+=f'<g transform="translate({math.tan(math.radians(10))*y:.5f} 0) skewX(-10)">'+F.label(309,y,'Hình. Dạng mạch vòng của maltose',29)+'</g>'
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="676" height="395" viewBox="0 0 676 395"><title>Dạng mạch vòng của maltose theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='maltose-lien-ket-mau-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=769,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2rings12blueCnums/blueObridge2bonds/redterminalOH/2CH2OH10H6OH/4TAPER2bold/allstereo/1openVleader/Liên kết (x)actualdam/captionitalicDDHpath/noanswer.')
(K/'cau-truc-maltose-lien-ket-mau-ddh-lo-265-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
