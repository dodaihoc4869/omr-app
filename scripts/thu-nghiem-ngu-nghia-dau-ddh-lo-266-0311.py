"""Tái tạo thử nghiệm ngữ nghĩa mũ+ngã; chưa phải font được duyệt."""
from pathlib import Path
import sys,json,hashlib
import argparse,subprocess,os,platform
from importlib.metadata import version
ap=argparse.ArgumentParser(description='Thử sửa sáu nhóm mũ+ngã. Chỉ ghi scratch; không thay font chính.')
for key in ('source','actual','generator','previous','out'):ap.add_argument('--'+key,required=True,type=Path)
cfg=ap.parse_args();P=cfg.out;P.mkdir(parents=True,exist_ok=True)
if P.resolve()==cfg.actual.resolve() or P.resolve() in cfg.actual.resolve().parents:raise ValueError('Thư mục ra phải riêng khỏi font chính')
script=Path(__file__).with_name('thu-nghiem-5a-ddh-lo-264-0311.py')
with (P/'r2-build.log').open('w') as log:subprocess.run([sys.executable,str(script),'--source',str(cfg.source),'--actual',str(cfg.actual),'--generator',str(cfg.generator),'--out',str(P/'r2-base')],check=True,stdout=log,stderr=subprocess.STDOUT)
s=(P/'r2-base/candidate-generator.py').read_text()
start=s.index('    if cp == 0x1eaa and mu and 0x303 in dm:');end=s.index('    elif mu and len(ds) == 1 and khac:',start)
new='''    if mu and 0x303 in dm and b in 'AaEeOo':
      # Ngữ nghĩa mũ+ngã: lấy ngã cùng chữ gốc, không dùng nhánh hỏi.
      from collections import Counter
      import pathops
      from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates,Glyph
      def get_parts(T):
        out=[];start=0
        for end in T.endPtsOfContours:
          out.append(([tuple(T.coordinates[i]) for i in range(start,end+1)],[T.flags[i]&1 for i in range(start,end+1)]));start=end+1
        return out
      def sig(q):
        flags=[x&1 for x in q[1]]
        return (len(flags),min(tuple(flags[j:]+flags[:j]) for j in range(len(flags))))
      canonical=Counter(sig(q)for q in get_parts(g[cm[ord(b)]]))
      def body_indices(chunks,allow_nesting=False):
        actual=Counter(sig(q)for q in chunks)
        if all(actual[k]==v for k,v in canonical.items()):return {j for j,q in enumerate(chunks)if sig(q)in canonical}
        if not allow_nesting:raise ValueError('Thân nguồn không khớp topology duy nhất '+chr(cp))
        paths=[]
        for pts,flags in chunks:
          z=Glyph();z.numberOfContours=1;z.coordinates=GlyphCoordinates(pts);z.flags=bytearray(flags);z.endPtsOfContours=[len(pts)-1]
          path=pathops.Path();z.draw(path.getPen(),g);paths.append(path)
        pairs=[(a,z)for a,path in enumerate(paths)for z,(pts,_)in enumerate(chunks)if a!=z and all(path.contains(pt)for pt in pts)]
        if len(pairs)!=1:raise ValueError('Không có cặp thân lồng duy nhất '+chr(cp))
        return set(pairs[0])
      chunks=than+dau;body=body_indices(chunks,cp==0x1eaa)
      than=[q for j,q in enumerate(chunks)if j in body];ds=[q for j,q in enumerate(chunks)if j not in body]
      tn=cm.get(ord(unicodedata.normalize('NFC',b+'\\u0303')))
      if not tn:raise ValueError('Thiếu chữ ngã cùng nguồn '+b)
      donor=get_parts(g[tn]);dbody=body_indices(donor);tilde=[q for j,q in enumerate(donor)if j not in dbody]
      if len(tilde)!=1:raise ValueError('Không nhận diện được riêng dấu ngã nguồn '+b)
      x0,y0,x1,y1=hop(ds);tx0,ty0,tx1,ty1=hop(tilde);xc=(x0+x1)/2
      if k['ten']=='Dam' and cp in {0x1ec4,0x1ed6}:y0=max(y0,max(y for pts,_ in than for _,y in pts)+r/2)
      ve_mu(xc,y0);tildeBottom=max(y1-(ty1-ty0),y0+d['h']+r)
      giu += [dich(q,xc-(tx0+tx1)/2,tildeBottom-ty0)for q in tilde]
'''
s=s[:start]+new+s[end:];(P/'semantic-generator.py').write_text(s);sys.argv=['generator',str(cfg.source),str(P/'semantic')];ns={};exec(compile(s,str(P/'semantic-generator.py'),'exec'),ns)
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
r={'dependencies':{'python':platform.python_version(),**{n:version(n)for n in ['fonttools','skia-pathops','brotli']}},'generatorInputSHA':hashlib.sha256(cfg.generator.read_bytes()).hexdigest(),'sourceFonts':{p.name:hashlib.sha256(p.read_bytes()).hexdigest()for p in cfg.source.glob('*.ttf')},'designEnvironment':{k:os.environ[k]for k in ['DDH_NET_DE','DDH_NET_DAM','DDH_TEP_DAM','DDH_DE','DDH_DAM','DDH_HEP','DDH_DAU','DDH_VE_DAU','DDH_LE','DDH_DUOI_A']if k in os.environ},'admissible':False,'scope':'Chỉ scratch semanticmũ+ngã sáu họ, chưaadopt/chưaápdụngclipping-NFDfix','files':{}}
for p in (P/'semantic').glob('*.woff2'):
 old=cfg.previous/p.name;a=TTFont(old);z=TTFont(p);ac=a.getBestCmap();zc=z.getBestCmap();changed=[];metrics=[]
 for cp,n in zc.items():
  pa=RecordingPen();pz=RecordingPen();a['glyf'][ac[cp]].draw(pa,a['glyf']);z['glyf'][n].draw(pz,z['glyf'])
  if pa.value!=pz.value:changed.append(cp)
  if a['hmtx'][ac[cp]]!=z['hmtx'][n]:metrics.append(cp)
 r['files'][p.name]={'sha':hashlib.sha256(p.read_bytes()).hexdigest(),'previousSHA':hashlib.sha256(old.read_bytes()).hexdigest(),'currentProductionSHA':hashlib.sha256((cfg.actual/p.name).read_bytes()).hexdigest(),'changedCPvsR2':changed,'hmtxDiff':metrics}
(P/'semantic-report.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));print(json.dumps(r,ensure_ascii=False))
