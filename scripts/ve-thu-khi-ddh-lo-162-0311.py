"""Ba cách thu khí nguồn209, nét chính thủ công, vùng bọt mờ giữ contour nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
from PIL import Image
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-chi-tiet-con-lai-lo-155.json').read_text())if r['i']==209)
b='<g transform="translate(15 15) scale(2)" stroke-linejoin="round" stroke-linecap="round">'
b+='<g fill="none" stroke="#252440" stroke-width=".8"><path d="M76 98V17Q76 7 84 7Q92 7 92 17V98M74 98H94M33 104H73Q81 104 81 96V15M33 108H76Q86 108 86 99V15M0 105H27M21 103L27 105L21 107"/><path d="M349 20V103Q349 114 356 114Q364 114 364 103V20M347 20H366M313 9H344Q354 9 354 23V106M313 13H341Q350 13 350 23V106M276 11H306M300 9L306 11L300 13"/><path d="M587 112V45Q587 38 594 38Q600 38 600 45V112M585 112H602M532 74H632V115Q632 123 624 123H540Q532 123 532 115ZM534 99H630M507 23L532 33M526 28L532 33L525 32M539 32L564 43Q569 46 571 64L585 115Q587 120 594 119M539 36L561 46Q565 49 567 65L581 116Q585 122 594 119M587 67H600"/></g>'
# Ký họa nước ngoài ống, không gán số hạt/bọt mới.
b+='<g stroke="#686873" stroke-width=".55">'
for row,y in enumerate(range(103,122,5)):
 for x in range(536+(row%2)*3,630,11):
  if not 579<x<603:b+=f'<path d="M{x} {y}h5"/>'
b+='</g>'
# Giữ từng mảng mực mờ của ROI bọt; không suy ra số lượng vòng tròn từ threshold.
im=Image.open(G/'docs/hinh-vector-0311/nguon/anh'/f"{r['hash']}.png").convert('L')
# Biên mảng mực tại ngưỡng cố định128; làm tròn góc biên, không gán số vòng bọt.
pixels={(x,y) for y in range(72,113) for x in range(588,600) if im.getpixel((x,y))<128}
edges={}
for x,y in pixels:
 for nb,u,v in [((x,y-1),(x,y),(x+1,y)),((x+1,y),(x+1,y),(x+1,y+1)),((x,y+1),(x+1,y+1),(x,y+1)),((x-1,y),(x,y+1),(x,y))]:
  if nb not in pixels:edges.setdefault(u,[]).append(v)
paths=[]
while edges:
 first=next(iter(edges));cur=first;pts=[]
 while True:
  pts.append(cur);nxt=edges[cur].pop()
  if not edges[cur]:del edges[cur]
  cur=nxt
  if cur==first:break
  if cur not in edges:break
 if len(pts)<3:continue
 mids=[((pts[j][0]+pts[(j+1)%len(pts)][0])/2,(pts[j][1]+pts[(j+1)%len(pts)][1])/2) for j in range(len(pts))]
 path=f'M{mids[-1][0]} {mids[-1][1]}'
 for j,(x,y) in enumerate(pts):path+=f'Q{x} {y} {mids[j][0]} {mids[j][1]}'
 paths.append(path+'Z')
b+='<path d="'+''.join(paths)+'" fill="#252440" fill-rule="evenodd"/>'
for x,y,t in [(61,150,'Cách 1'),(338,150,'Cách 2'),(587,150,'Cách 3')]:b+=F.label(x,y,t,18)
b+=F.label(672,122,'nước',15,'start')+'<path d="M664 118L618 107" stroke="#252440" stroke-width=".8"/></g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1470" height="370" viewBox="0 0 1470 370"><title>Ba cách thu khí theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='thu-khi-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='3method/doublewalltubes/3inputarrows/3captions/nước+leader;ROI588..599,72..112giữbiênmựcnguồnngưỡngcốđịnh128/làmtròngóc khôngđoánsốbubble,CHƯAđượcxemđạtphongcáchtrướcsoátđộclập.')
(M/'cau-truc-thu-khi-ddh-lo-162-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
