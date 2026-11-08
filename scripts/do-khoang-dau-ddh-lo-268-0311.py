"""Đo bao đường cong của dấu R4; không suy bao chữ chạm nhau là nét chạm nhau."""
from pathlib import Path
import argparse,json,hashlib
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.pointPen import PointToSegmentPen
p=argparse.ArgumentParser();p.add_argument('--font-dir',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
expected={'de':'ec3c249d69edb5e97f3079b7a19f9f485739f8cf2e8152edea25107370658e37','dam':'c5f78fb3b1b7c81683b170c1ae8adaf24fd0b9b0f2022d6d4e068deb2b0ee123'};rows=[]
for weight in expected:
 path=a.font_dir/f'unified-{weight}.woff2';digest=hashlib.sha256(path.read_bytes()).hexdigest();assert digest==expected[weight];f=TTFont(path)
 for ch,bodycount in [('Ẫ',2),('Ễ',1),('Ỗ',2)]:
  name=f.getBestCmap()[ord(ch)];g=f['glyf'][name];assert not g.isComposite() and g.numberOfContours==bodycount+2
  starts=[0]+[v+1 for v in g.endPtsOfContours[:-1]];bounds=[]
  for start,end in zip(starts,g.endPtsOfContours):
   pen=BoundsPen(None);points=PointToSegmentPen(pen);points.beginPath()
   for j in range(start,end+1):points.addPoint(tuple(g.coordinates[j]),segmentType='qcurve'if g.flags[j]&1 else None)
   points.endPath();bounds.append(pen.bounds)
  bodytop=max(b[3]for b in bounds[:bodycount]);marks=bounds[bodycount:];advance,lsb=f['hmtx'][name]
  rows.append(dict(weight=weight,ch=ch,fontHash=digest,advance=advance,lsb=lsb,bodyTop=bodytop,curveBounds=bounds,markHeights=[b[3]-b[1]for b in marks],markWidths=[b[2]-b[0]for b in marks],verticalDisjointEnvelopeTopNoGaps=bodytop+sum(b[3]-b[1]for b in marks),horizontalDisjointEnvelopeWidthNoGap=sum(b[2]-b[0]for b in marks)))
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(dict(rows=rows,globalAdmitted=False,productionAdopt=False,candidateCreated=False,limits='Chỉ chứng minh ràng buộc bao dấu tách dọc/ngang với nét nguyên kích thước. Không chứng minh mọi cách đan xen đường cong đều bất khả thi; không dùng bao chồng làm bằng chứng va nét. Actual clipping giữ proof267.'),ensure_ascii=False,indent=2)+'\n');print('Đã đo6glyph,không sửa font.')
