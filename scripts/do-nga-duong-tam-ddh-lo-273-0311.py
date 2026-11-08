"""Thử đường tâm dấu ngã giữ độ dày nét: chỉ SVG chẩn đoán, không tạo font."""
import sys,copy,json,argparse,hashlib
a=argparse.ArgumentParser();a.add_argument("--font-dir",required=True);a.add_argument("--deps",required=True);a.add_argument("--out",required=True);o=a.parse_args()
from pathlib import Path
sys.path.insert(0,o.deps)
import pathops
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
from fontTools.pens.svgPathPen import SVGPathPen
b=Path(o.out);b.mkdir(parents=True,exist_ok=True);rows=[];inputs={}
def part(g,ix):
 starts=[0]+[v+1 for v in g.endPtsOfContours[:-1]];co=[];fl=[];ep=[]
 for j in ix:a=starts[j];z=g.endPtsOfContours[j]+1;co+=list(g.coordinates[a:z]);fl+=list(g.flags[a:z]);ep.append(len(co)-1)
 h=copy.deepcopy(g);h.coordinates=GlyphCoordinates(co);h.flags=bytearray(fl);h.endPtsOfContours=ep;h.numberOfContours=len(ep);p=pathops.Path();h.draw(p.getPen(),None);return p
for s,t in [('de',82),('dam',120)]:
 fp=Path(o.font_dir)/('unified-'+s+'.woff2');digest=hashlib.sha256(fp.read_bytes()).hexdigest();assert digest=={'de':'ec3c249d69edb5e97f3079b7a19f9f485739f8cf2e8152edea25107370658e37','dam':'c5f78fb3b1b7c81683b170c1ae8adaf24fd0b9b0f2022d6d4e068deb2b0ee123'}[s];inputs[s]=digest;f=TTFont(fp);html=''
 for mode,A in [('R4',None),('wave24',24),('wave12',12)]:
  paths=[];adv=0
  for ch,nb in [('Ẫ',2),('ẫ',2),('Ễ',1),('ễ',2),('Ỗ',2),('ỗ',2)]:
   n=f.getBestCmap()[ord(ch)];g=f['glyf'][n];tilde=part(g,[nb]);base=part(g,[j for j in range(g.numberOfContours)if j!=nb]);x0,y0,x1,y1=tilde.bounds
   if A is not None:
    L=(x1-x0-t)/2;p=pathops.Path();p.moveTo(-L,0);p.cubicTo(-L,A,-L/3,A,0,0);p.cubicTo(L/3,-A,L,-A,L,0);p.stroke(t,pathops.LineCap.ROUND_CAP,pathops.LineJoin.ROUND_JOIN,4);p.convertConicsToQuads(.01);a,z,aa,zz=p.bounds;p=p.transform(1,0,0,1,(x0+x1)/2,y0-z);tilde=p
   combined=pathops.Path(base);combined.addPath(tilde);combined=combined.transform(1,0,0,1,adv,0);pen=SVGPathPen(None);combined.draw(pen);paths.append(pen.getCommands());rows.append({'style':s,'mode':mode,'glyph':ch,'centerlineControlAmplitude':A,'strokeDiameter':t if A is not None else None,'tildeBounds':tilde.bounds,'tildeHeight':tilde.bounds[3]-tilde.bounds[1]});adv+=f['hmtx'].metrics[n][0]
  for size in [16,32,200]:
   html+=f'<h3>{s} {mode} {size}px</h3><svg width="{adv*size/1000+20}" height="{1.5*size}" viewBox="-30 -1300 {adv+60} 1500"><path fill="#252440" transform="scale(1,-1)" d="{" ".join(paths)}"/></svg>'
 (b/f'{s}.html').write_text('<style>body{background:white}h3{font:14px sans-serif;margin:4px}</style>'+html)
(b/'geometry.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))

(b/"inputs.json").write_text(json.dumps({"inputs":inputs,"fontCandidateCreated":False,"productionAdopt":False,"scope":"SVG family diagnostics only; no actualfontfit/CDP/NFCNFD proof"},indent=2))
