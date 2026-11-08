"""Rebuild NEGATIVE diagnostic276; no production edits or admission.
Usage: python build-candidate.py [output_dir]
Base269 includes scoped DeẪ translation. Only R4DeỖ changes here.
All cmap aliases resolve to same glyph name; NFC/NFD shaping checked explicitly.
New timestamp may change SHA; old visual proof MUST NOT be assigned new SHA.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
import copy,json,hashlib,sys,io,unicodedata,argparse
a=argparse.ArgumentParser();a.add_argument("--base-269-dir",required=True);a.add_argument("--r4-dir",required=True);a.add_argument("--out",required=True);o=a.parse_args()
import uharfbuzz as hb
base=Path(o.base_269_dir)
r4=Path(o.r4_dir)
out=Path(o.out)
out.mkdir(parents=True,exist_ok=True)
report={'negativeDiagnosticOnly':True,'oldActualProofNotTransferred':True,'fonts':{}}
for style in ['de','dam']:
 src=base/f'unified-{style}-partial-chua-admit.woff2';assert hashlib.sha256(src.read_bytes()).hexdigest()=={'de':'0fa021440f18da5b3021a074dfa65e5a404d42a72ec7f06fc9cdf96893f68c61','dam':'0bd7fe68acbaccb2c7ef82894608562f18d27887c32b5a07c427da179893eef8'}[style];f=TTFont(src);before=TTFont(src);cm=f.getBestCmap()
 if style=='de':
  source=TTFont(r4/'unified-de.woff2');name=cm[ord('Ỗ')];assert source.getBestCmap()[ord('Ỗ')]==name
  g=copy.deepcopy(source['glyf'][name]);assert g.numberOfContours==4
  starts=[0]+[e+1 for e in g.endPtsOfContours[:-1]]
  # Semantic source-audited order: body contours0/1, tilde2, hat3.
  for contour,(dx,dy)in [(2,(-181,-161)),(3,(117,-45))]:
   for j in range(starts[contour],g.endPtsOfContours[contour]+1):
    x,y=g.coordinates[j];g.coordinates[j]=(x+dx,y+dy)
  assert list(g.coordinates[:starts[2]])==list(source['glyf'][name].coordinates[:starts[2]])
  g.recalcBounds(f['glyf']);f['glyf'][name]=g
 # Do not copy hmtx or metric tables; assert untouched in memory.
 assert f['hmtx'].metrics==before['hmtx'].metrics
 assert all(f[t].compile(f)==before[t].compile(before)for t in ['hhea','OS/2'])
 target=out/f'unified-{style}.woff2'
 if style=='dam':target.write_bytes(src.read_bytes())
 else:f.save(target)
 built=TTFont(target);assert built['hmtx'].metrics==before['hmtx'].metrics
 changed=[]
 for n in before.getGlyphOrder():
  a=RecordingPen();b=RecordingPen();before.getGlyphSet()[n].draw(a);built.getGlyphSet()[n].draw(b)
  if a.value!=b.value:changed.append(n)
 assert changed==(['uni1ED6']if style=='de'else[])
 # No alias/GSUB rewrites: shared glyph object updates all cmap aliases.
 assert all(x.cmap==y.cmap for x,y in zip(before['cmap'].tables,built['cmap'].tables))
 assert all(before[t].compile(before)==built[t].compile(built)for t in ['GSUB','GPOS','GDEF'])
 built.flavor=None;buf=io.BytesIO();built.save(buf);font=hb.Font(hb.Face(buf.getvalue()));hb.ot_font_set_funcs(font);order=built.getGlyphOrder();checks=[]
 for ch in ['Ẫ','Ễ','Ỗ']:
  shaped=[]
  for form in ['NFC','NFD']:
   b=hb.Buffer();b.add_str(unicodedata.normalize(form,ch));b.guess_segment_properties();hb.shape(font,b)
   shaped.append([(i.codepoint,p.x_advance,p.x_offset,p.y_offset)for i,p in zip(b.glyph_infos,b.glyph_positions)])
  assert shaped[0]==shaped[1]
  assert len(shaped[0])==1 and order[shaped[0][0][0]]==built.getBestCmap()[ord(ch)]
  checks.append({'char':ch,'NFCNFDsame':True,'gid':shaped[0][0][0],'glyph':order[shaped[0][0][0]]})
 report['fonts'][style]={'base269SHA':hashlib.sha256(src.read_bytes()).hexdigest(),'newSHA':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'hmtxExact':True,'hheaOS2Exact':all(before[t].compile(before)==built[t].compile(built)for t in ['hhea','OS/2']),'changedGlyphs':changed,'allCmapTablesExact':True,'layoutTablesExact':True,'shaping':checks,'DeOAffectedCmapAliases':sorted(cp for cp,n in built.getBestCmap().items()if n=='uni1ED6')}
(out/'builder-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
