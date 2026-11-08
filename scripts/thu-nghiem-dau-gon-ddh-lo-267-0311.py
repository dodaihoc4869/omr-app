"""Thử co đều XY nhóm dấu trên ba chữ hoa R4; chỉ scratch, KHÔNG phải thiết kế/font đạt."""
from pathlib import Path
import argparse,json,hashlib,platform
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
ap=argparse.ArgumentParser(description=__doc__)
ap.add_argument('--font-dir',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);cfg=ap.parse_args();cfg.out.mkdir(parents=True,exist_ok=True)
assert cfg.font_dir.resolve()!=cfg.out.resolve(),'Không ghi đè font đầu vào'
expected={'de':'ec3c249d69edb5e97f3079b7a19f9f485739f8cf2e8152edea25107370658e37','dam':'c5f78fb3b1b7c81683b170c1ae8adaf24fd0b9b0f2022d6d4e068deb2b0ee123'}
report={'admissible':False,'diagnosticOnly':True,'productionChanged':False,'python':platform.python_version(),'fonts':{},'gioiHan':'Bodycontourindices chỉđúngR4đãaudit/exactinputSHA,khôngarea/bboxclassify. CoXYđều giữtỉlệhìnhdấu/néttròn nhưngcóthểlàmquánhỏ/mảnh. Canvasbbox KHÔNGđồngnghĩaactualinkclipping; cầnactualDOMinkrows+SVG/CDP/newexacthash. Khôngđượcadoptthửnày.'}
for weight in ['de','dam']:
 p=cfg.font_dir/f'unified-{weight}.woff2';sha=hashlib.sha256(p.read_bytes()).hexdigest();assert sha==expected[weight],'Đầu vào không phải đúng R4 đãaudit'
 f=TTFont(p);cm=f.getBestCmap();audit=[];metrics={n:tuple(v)for n,v in f['hmtx'].metrics.items()}
 for ch,nb in [('Ẫ',2),('Ễ',1),('Ỗ',2)]:
  g=f['glyf'][cm[ord(ch)]];assert g.numberOfContours==nb+2,'Không đúng thứ tựbody+2marksR4'
  start=g.endPtsOfContours[nb-1]+1;old=list(g.coordinates);body=old[:start];marks=old[start:];by=max(y for x,y in body);lo=min(y for x,y in marks);hi=max(y for x,y in marks);xc=(min(x for x,y in marks)+max(x for x,y in marks))/2
  scale=min(1,(970-(by+20))/(hi-lo));new=body+[(round(xc+(x-xc)*scale),round(by+20+(y-lo)*scale))for x,y in marks];g.coordinates=GlyphCoordinates(new);g.recalcBounds(f['glyf']);assert new[:start]==old[:start]
  audit.append(dict(glyph=ch,bodyContourIndices=list(range(nb)),markContourIndices=list(range(nb,g.numberOfContours)),scaleUniformXY=scale,bodyYmax=by,oldMarkBoundsY=[lo,hi],newMarkBoundsY=[min(y for x,y in new[start:]),max(y for x,y in new[start:])],gapBody=20,xCenter=xc))
 assert metrics=={n:tuple(v)for n,v in f['hmtx'].metrics.items()}
 q=cfg.out/f'unified-{weight}.woff2';f.save(q);report['fonts'][weight]=dict(inputSHA=sha,outputSHA=hashlib.sha256(q.read_bytes()).hexdigest(),bytes=q.stat().st_size,allHmtxUnchanged=True,targets=audit)
(cfg.out/'compact-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
