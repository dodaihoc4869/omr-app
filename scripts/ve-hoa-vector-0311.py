"""Dựng hình học thủ công từ hình nguồn đã mở riêng; không suy công thức từ thumbnail."""
from pathlib import Path
import json,math,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';S=G/'docs/hinh-vector-0311/nguon';D=sorted(json.loads((S/'kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);reg=json.loads((M/'mau-da-duyet.json').read_text())
HASH_NGUON={14: '0221fbc67e2428efcf900364916a9d651a11a869d0ee40e1af07276f0d9f31f8', 22: '03aa1f42f69d26fc8100de0f17cda5072d5149c61051aa09a476834f4997a1ac', 45: '0998c4ae2c931e01ad5b3c19128fb0c1c20414836d9d0413ca523ec2a1d70e96', 560: '6877f1be391569da3f7c3d244d7940ecb7c3f16221a78b630c87d34acc41ef96', 577: '6be1c3244a4ee89e40ecd5ddcb70d95a98b912e2c801bcef8fce2ea15bb91e93', 609: '70bfd8e31ade588266c3d0c9fd50af5d24e33f7b4a60a80bbf192d68818d07fa'}
ink='#252440';teal='#087f8e'
def line(a,b,w=3):return f'<path d="M{a[0]:.2f} {a[1]:.2f}L{b[0]:.2f} {b[1]:.2f}" fill="none" stroke="{ink}" stroke-width="{w}" stroke-linecap="round"/>'
def label(x,y,s,anchor='middle',size=31):return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="DejaVu Sans,Arial,sans-serif" font-size="{size}" fill="{ink}">{s}</text>'
def ring(cx=300,cy=270,r=86,circle=False):
 pts=[(cx+r*math.cos(math.radians(-90+k*60)),cy+r*math.sin(math.radians(-90+k*60)))for k in range(6)]
 s=''.join(line(pts[k],pts[(k+1)%6])for k in range(6))
 if circle:s+=f'<circle cx="{cx}" cy="{cy}" r="{r*.6}" fill="none" stroke="{ink}" stroke-width="3"/>'
 else:
  inner=[(cx+(x-cx)*.81,cy+(y-cy)*.81)for x,y in pts]
  s+=''.join(line(inner[k],inner[(k+1)%6],2.5)for k in [0,2,4])
 return s,pts
records=[]
def save(idx,title,b):
 a=next(x for x in D if x['hash']==HASH_NGUON[idx]);fn='hoa-'+a['hash']+'.svg';svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520" role="img"><title>{title}</title>{b}</svg>'
 (M/fn).write_text(svg);reg[a['hash']]=fn
 records.append({'i':idx,'hash':a['hash'],'svg':fn,'ten':title,'trangThai':'ve-thu-cong-cho-soat-doc-lap','ghiChu':'Phải đối chiếu liên kết, vị trí thế, số nguyên tử và mọi nhãn với nguồn gốc trước khi tích hợp.'})
# Dopamine: hai OH liền kề; nhánh ethylamine giữ đúng 2 carbon ngoài vòng.
b,p=ring(300,230,88)
b+=line(p[5],(180,161))+label(167,167,'HO','end')+line(p[4],(180,299))+label(167,310,'HO','end')
b+=line(p[2],(450,318))+line((450,318),(525,274))+line((525,274),(569,300))+label(582,316,'NH₂','start')
b+=f'<text x="425" y="420" text-anchor="middle" font-family="DejaVu Sans,Arial,sans-serif" font-size="28" fill="{teal}">Dopamine</text>'
save(14,'Cấu trúc dopamine',b)
# Cinnamaldehyde: vòng–CH=CH–CHO, giữ cả hai carbon alkene và nhóm aldehyde.
b,p=ring(245,300,84)
b+=line(p[1],(390,215))+line((390,215),(460,255))+line((405,209),(459,240),2.5)+line((460,255),(530,215))
b+=line((526,212),(526,150))+line((535,212),(535,150))+label(530,134,'O')+line((530,215),(583,245))+label(603,262,'H')
save(45,'Cấu trúc cinnamaldehyde theo hình nguồn',b)
# Benzoic acid: giữ vòng biểu diễn bằng vòng tròn như nguồn.
b,p=ring(450,310,100,circle=True);b+=line(p[0],(450,163))+label(450,143,'COOH')
save(560,'Cấu trúc benzoic acid',b)
# Phenylalanine: không thêm liên kết nêm hoặc tự gán cấu hình lập thể.
b,p=ring(245,300,84);b+=line(p[1],(390,215))+line((390,215),(460,255))+line((460,255),(530,215))
b+=line((460,255),(460,320))+label(460,359,'NH₂')+line((526,212),(526,150))+line((535,212),(535,150))+label(530,134,'O')+line((530,215),(583,245))+label(606,262,'OH','start')
save(577,'Cấu trúc phenylalanine theo hình nguồn',b)
# Aspirin: COOH và OCOCH₃ ở hai vị trí ortho.
b,p=ring(390,305,100);b+=line(p[0],(390,156))+label(390,137,'COOH')+line(p[1],(527,226))+label(546,234,'OCOCH₃','start')
save(609,'Cấu trúc aspirin theo hình nguồn',b)
# Melamine: vòng 1,3,5-triazine, ba nhóm NH₂; bond dừng ngoài chữ N.
pts=[(450,160),(537,210),(537,310),(450,360),(363,310),(363,210)]
b=line(pts[0],(516,198))+line((537,234),pts[2])+line(pts[2],(472,347))+line((428,347),pts[4])+line(pts[4],(363,234))+line((384,198),pts[0])
b+=line((450,178),(514,215),2.5)+line((519,301),(470,330),2.5)+line((381,300),(381,238),2.5)
b+=label(537,222,'N')+label(450,371,'N')+label(363,222,'N')
b+=line(pts[0],(450,116))+label(450,99,'NH₂')+line(pts[2],(583,337))+label(603,353,'NH₂','start')+line(pts[4],(317,337))+label(298,353,'H₂N','end')
save(22,'Cấu trúc melamine',b)
(M/'hoa-ve-thu-cong-map.json').write_text(json.dumps({r['hash']:r['svg'] for r in records},indent=2))
(M/'hoa-ve-thu-cong.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
print('Đã dựng 6 hình hóa học; chờ soát độc lập, chưa đánh dấu đã duyệt.')
