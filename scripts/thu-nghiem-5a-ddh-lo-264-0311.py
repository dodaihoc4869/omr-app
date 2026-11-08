"""Thử nghiệm có thể tái tạo; chưa phải bộ font được duyệt."""
from pathlib import Path
import sys,json,hashlib
import argparse,platform
from importlib.metadata import version
ap=argparse.ArgumentParser(description='Thử nghiệm sửa thân5A và dấu ngã; chỉ ghi thư mục scratch, không thay font chính.')
for key in ('source','actual','generator','out'):ap.add_argument('--'+key,required=True,type=Path)
cfg=ap.parse_args();P=cfg.out;P.mkdir(parents=True,exist_ok=True);gen=cfg.generator.read_text()
old="    if valid:idx=[j for j,q in enumerate(cs) if signature(q) in wanted]\n"
new=old+'''    if not valid and cp in {0x1eaa,0x1eac,0x1eb2,0x1eb4,0x1eb6}:
      # Thử nghiệm có giới hạn: cặp đường bao lồng duy nhất của thân A nguồn.
      paths=[]
      for q in cs:
        z=join(g[n],[q]);p=pathops.Path();z.draw(p.getPen(),g);paths.append(p)
      pairs=[(outer,inner) for outer,p in enumerate(paths) for inner,q in enumerate(cs)
             if outer!=inner and all(p.contains((x,y)) for x,y,_ in q)]
      if len(pairs)==1:idx=list(pairs[0]);valid=True
'''
assert old in gen;gen=gen.replace(old,new)
# Giữ ngữ nghĩa dấu ngã; không biến trường hợp xm=None thành hỏi.
old="    if mu and len(ds) == 1 and khac:  # mũ dính liền dấu (ấ, ẩ của gốc)"
new='''    if cp == 0x1eaa and mu and 0x303 in dm:
      # Mũ+ngã: lấy ngã cùng họ A, không lấy hỏi Ả.
      tn=cm.get(ord('Ã'));tilde=[]
      if tn:
        T=g[tn];start=0
        for end in T.endPtsOfContours:
          pts=[tuple(T.coordinates[i]) for i in range(start,end+1)]
          if min(y for _,y in pts)>nguong:tilde.append((pts,[T.flags[i]&1 for i in range(start,end+1)]))
          start=end+1
      if not tilde:raise ValueError('Thiếu đường nét ngã nguồn A')
      # Thân A là cặp đường bao lồng duy nhất; mũ thấp không được giữ nhầm trong thân theo ngưỡng y.
      import pathops
      from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
      chunks=than+dau;paths=[]
      for pts,flags in chunks:
        z=TTGlyphPen(g)
        from fontTools.ttLib.tables._g_l_y_f import Glyph
        glone=Glyph();glone.numberOfContours=1;glone.coordinates=GlyphCoordinates(pts);glone.flags=bytearray(v&1 for v in flags);glone.endPtsOfContours=[len(pts)-1]
        path=pathops.Path();glone.draw(path.getPen(),g);paths.append(path)
      pairs=[(a,b)for a,path in enumerate(paths)for b,(pts,_)in enumerate(chunks)if a!=b and all(path.contains(pt)for pt in pts)]
      if len(pairs)!=1:raise ValueError('Thân A ngã không có cặp lồng duy nhất')
      body=set(pairs[0]);than=[q for j,q in enumerate(chunks)if j in body];ds=[q for j,q in enumerate(chunks)if j not in body]
      x0,y0,x1,y1=hop(ds);tx0,ty0,tx1,ty1=hop(tilde)
      # Mũ ở đáy khung nguồn; ngã trên đỉnh khung nguồn, cùng trục.
      xc=(x0+x1)/2;ve_mu(xc,y0)
      tildeBottom=max(y1-(ty1-ty0),y0+d['h']+r)
      giu += [dich(q,xc-(tx0+tx1)/2,tildeBottom-ty0) for q in tilde]
    elif mu and len(ds) == 1 and khac:  # mũ dính liền dấu (ấ, ẩ của gốc)'''
assert old in gen;gen=gen.replace(old,new)
(P/'candidate-generator.py').write_text(gen)
sys.argv=['generator',str(cfg.source),str(P/'candidate')];ns={};exec(compile(gen,str(P/'candidate-generator.py'),'exec'),ns)
(P/'body-audit.json').write_text(json.dumps(ns['_BODY_AUDIT'],ensure_ascii=False,indent=2))
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
report={'dependencies':{'python':platform.python_version(),**{n:version(n)for n in ['fonttools','skia-pathops','brotli']}},'inputs':{k:{'path':str(getattr(cfg,k)),'sha':hashlib.sha256(getattr(cfg,k).read_bytes()).hexdigest()}for k in ['generator']},'sourceFonts':{p.name:hashlib.sha256(p.read_bytes()).hexdigest()for p in cfg.source.glob('*.ttf')},'admissible':False,'scope':'Scratch5A nesting+semantic tilde; chưa soát độc lập/chưa thay font chính','subsets':{}}
for p in (P/'candidate').glob('*.woff2'):
 a=TTFont(cfg.actual/p.name);b=TTFont(p);ac=a.getBestCmap();bc=b.getBestCmap();changed=[];metrics=[];bounds=[]
 for cp,n in bc.items():
  aa=a['glyf'][ac[cp]];bb=b['glyf'][n];pa=RecordingPen();pb=RecordingPen();aa.draw(pa,a['glyf']);bb.draw(pb,b['glyf'])
  if pa.value!=pb.value:changed.append(cp)
  if a['hmtx'][ac[cp]]!=b['hmtx'][n]:metrics.append(cp)
  if [getattr(aa,k,None)for k in ['xMin','yMin','xMax','yMax']] !=[getattr(bb,k,None)for k in ['xMin','yMin','xMax','yMax']]:bounds.append({'cp':cp,'old':[getattr(aa,k,None)for k in ['xMin','yMin','xMax','yMax']],'new':[getattr(bb,k,None)for k in ['xMin','yMin','xMax','yMax']]})
 report['subsets'][p.name]={'actualSHA':hashlib.sha256((cfg.actual/p.name).read_bytes()).hexdigest(),'candidateSHA':hashlib.sha256(p.read_bytes()).hexdigest(),'changedCP':changed,'metricMismatch':metrics,'bboxDiff':bounds}
(P/'candidate-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
