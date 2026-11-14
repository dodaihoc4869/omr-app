from pathlib import Path
import json, hashlib, importlib.util
G=Path(__file__).resolve().parents[1]; K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py'); F=importlib.util.module_from_spec(s); s.loader.exec_module(F)
h='06a4f853c24b6f400d9372303462d08b4a8f8981a5c8f19f7ba7da612d0cc200'; b=''
def path(d):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#444444" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"/>'
# Ba carbon glycerol trần; ba nét đi đến O đầu của nhóm OOC viết gọn.
path('M70 81L48 103L71 146L48 189L69 209M71 146L106 146')
# Từng mạch đọc riêng, đầu nét cạnh chữ C không phải carbon trần bổ sung.
path('M144 65L186 42L228 65L271 42L313 65L355 42L397 65L441 42L482 65L525 42L567 65L609 42L651 65L694 42L736 65L777 43')
path('M180 149L222 124L265 149L307 124L350 149L392 124L434 149L476 124L520 149L604 149L646 124L689 149L731 124L774 149L816 124L858 149L900 124L942 149')
path('M532 135L589 135')
path('M138 226L180 250L223 227L265 250L307 227L350 250L392 227L434 250L477 227L562 227L604 250L647 227L731 227L774 250L816 227L858 250L900 227L942 250')
path('M491 241L548 241M661 241L717 241')
for x,y in [(123,78),(163,154),(123,232)]:
 b+=F.label(x+F.advance('C',28)/2,y,'OOC',28,anchor='end',fill='#000000')
# Điểm nhỏ tách rời dưới trái: giữ hình học, không gán điện tích/hạt.
b+='<path d="M28.5 264L29.5 264" fill="none" stroke="#aaaaaa" stroke-width="0.65"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="995" height="292" viewBox="0 0 995 292"><title>Triester nguồn31</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest(); fn='triester31-native-ddh-'+hh+'.svg'; (K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text()); qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs: qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
assert len(qs)==1 and qs[0]['qid']=='12-KT-C1-D5-III-3'
note='55C6O=3bareglycerol+16-18-18acyl/CC0-1-2/3literalOOC-LASTCanchors-NOexpandedCO/ALLregularUPRIGHT/ALLthin-gray/individualnonperiodicvertices-rays/isolatedBOTTOMLEFTgrayUNKNOWNretain-NOTcharge/0H-arrow-stereo-caption/NOaddedH-formula-X-name-answer/nativeapproxNOTsubpixel'
r=dict(i=31,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-triester31-native-ddh-lo-447-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-triester31-lo-447.json').write_text(json.dumps(dict(hash=h,native=[995,292],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/FULL3x/left4x/all1publicde.3bareglycerol+15/17/17barechains+3literalOOC-C=55C6O/CC0-1-2. No addedC at labelbondstarts, expandedCO, H2C-HC, Xcaption or answer. Individual native vertices retained; tinyBOTTOMLEFTgraymark UNKNOWN.'),ensure_ascii=False,indent=2)+'\n')
print(hh,len(raw))
