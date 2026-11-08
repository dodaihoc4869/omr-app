"""Đo mũ giữ đường kính nét, chỉ chẩn đoán master V, không dựng font production."""
from pathlib import Path
import sys,json,math,argparse,hashlib
a=argparse.ArgumentParser();a.add_argument('--generator',required=True);a.add_argument('--deps',required=True);a.add_argument('--source',required=True);a.add_argument('--out',required=True);o=a.parse_args();out=Path(o.out);out.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,o.deps);sys.argv=['probe',o.source,str(out/'unused')];ns={};exec(Path(o.generator).read_text().split('os.makedirs(RA, exist_ok=True)')[0],ns)
from fontTools.pens.svgPathPen import SVGPathPen
import pathops
rows=[];html=''
for st,W,t,Hs,body,tilde,gap in [('de',370,82,[170,140,110,82],742,139,12),('dam',400,120,[190,160,140,120],756,176,26)]:
 for H in Hs:
  r=t/2;xc=250;ap=(xc,H-r);polys=ns['_hop_nhanh']([ns['_vien']((xc-W/2+r,r),ap,r),ns['_vien'](ap,(xc+W/2-r,r),r)]);p=pathops.Path();pen=p.getPen()
  for q in polys:
   pen.moveTo(q[0]);[pen.lineTo(v)for v in q[1:]];pen.closePath()
  z=SVGPathPen(None);p.draw(z);angle=math.degrees(math.atan2(H-t,W/2-r));row={'style':st,'width':W,'strokeDiameter':t,'hatHeight':H,'centerlineRise':H-t,'branchAngleDegrees':angle,'centeredSeparatedEnvelopeTopAtBodyE':body+gap+H+gap+tilde,'degeneratesIntoBar':H==t};rows.append(row);html+=f'<article><h3>{st} H{H} t{t}, angle {angle:.1f}°</h3><svg width="350" height="200" viewBox="0 -230 500 260"><path fill="#252440" transform="scale(1,-1)" d="{z.getCommands()}"/></svg></article>'
(out/'stroke-budget.json').write_text(json.dumps(rows,indent=2));(out/'hats.html').write_text('<style>body{background:white;display:grid;grid-template-columns:repeat(4,355px)}h3{font:14px sans-serif}article{border:1px solid #ddd}</style>'+html)

(out/"inputs.json").write_text(json.dumps({"generatorSha256":hashlib.sha256(Path(o.generator).read_bytes()).hexdigest(),"scope":"8 V-master diagnostics only; no fontcandidate, no globalimpossibility", "productionAdopt":False},indent=2))
