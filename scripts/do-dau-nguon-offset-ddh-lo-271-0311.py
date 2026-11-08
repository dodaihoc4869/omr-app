"""Đối chứng chiều cao dấu nguồn vàstroke đườngcong; khôngtạocandidatefont/khôngđổimetrics."""
from pathlib import Path
import sys,copy,json,argparse,hashlib
p=argparse.ArgumentParser();p.add_argument("--source",type=Path,required=True);p.add_argument("--out",type=Path,required=True);args=p.parse_args()

import pathops
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
from fontTools.pens.boundsPen import BoundsPen
from pathlib import Path
out=[];b=args.out;b.mkdir(parents=True,exist_ok=True)
for style,weight,net,sx in [('de','Regular',12,1.01),('dam','Medium',26,.98)]:
 source=args.source/('MPLUSRounded1c-'+weight+'.ttf');expected={'Regular':'b75708b53e45b06d17d470aeeca5b766e3d1b3999f03f13ec4eb863ca846c14c','Medium':'adfde1b6bae58719c4e0144612a94232e72fc5ca655c4722165fe88d06521a70'};assert hashlib.sha256(source.read_bytes()).hexdigest()==expected[weight];f=TTFont(source);cm=f.getBestCmap()
 for ch,idx in [('Ã',2),('ã',2),('Ẽ',0),('ẽ',0),('Õ',2),('õ',2),('Â',None),('Ê',None),('Ô',None)]:
  g=f['glyf'][cm[ord(ch)]];starts=[0]+[v+1 for v in g.endPtsOfContours[:-1]]
  if idx is None:
   # canonical source circumflex index recorded separately; no runtime bbox filter.
   idx={'Â':2,'Ê':0,'Ô':2}[ch]
  a=starts[idx];z=g.endPtsOfContours[idx]+1;h=copy.deepcopy(g);h.coordinates=GlyphCoordinates(g.coordinates[a:z]);h.flags=bytearray(g.flags[a:z]);h.endPtsOfContours=[z-a-1];h.numberOfContours=1;p=pathops.Path();h.draw(p.getPen(),f['glyf']);p.simplify(fix_winding=True);q=pathops.Path(p);q.stroke(2*net,pathops.LineCap.ROUND_CAP,pathops.LineJoin.ROUND_JOIN,4);q.convertConicsToQuads(.01);u=pathops.op(p,q,pathops.PathOp.UNION)
  out.append({'style':style,'sourceGlyph':ch,'sourceContour':idx,'sourceCurveBounds':p.bounds,'curveAwareDilatedBounds':u.bounds,'sourceHeight':p.bounds[3]-p.bounds[1],'curveAwareHeight':u.bounds[3]-u.bounds[1],'net':net})
(b/'mark-probe.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print('Đã đo18donorcontours,khôngsửa font.')
