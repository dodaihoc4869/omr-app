"""Thử phủ dấu NFD và epsilon, gộp font có đối chiếu glyph trùng; không thay font chính."""
from pathlib import Path
import sys,json,hashlib,argparse,platform,unicodedata
from importlib.metadata import version
from fontTools.ttLib import TTFont
from fontTools.merge import Merger
from fontTools.pens.recordingPen import RecordingPen
import uharfbuzz as hb
ap=argparse.ArgumentParser(description=__doc__)
for key in ('source','semantic_generator','out'):ap.add_argument('--'+key.replace('_','-'),required=True,type=Path)
cfg=ap.parse_args();out=cfg.out;out.mkdir(parents=True,exist_ok=True)
code=cfg.semantic_generator.read_text().split('os.makedirs(RA, exist_ok=True)')[0]
sys.argv=['generator',str(cfg.source),str(out)];ns={};exec(compile(code,str(cfg.semantic_generator),'exec'),ns)
marks=[0x300,0x301,0x302,0x303,0x304,0x306,0x308,0x309,0x31b,0x323,0x329]
ns['LATIN']=sorted(set(ns['LATIN']+marks+[0x3b5]));ns['VIET']=sorted(set(ns['VIET']+marks))
report={'admissible':False,'productionChanged':False,'generatorSHA':hashlib.sha256(cfg.semantic_generator.read_bytes()).hexdigest(),'dependencies':{'python':platform.python_version(),**{n:version(n)for n in ['fonttools','uharfbuzz','skia-pathops','brotli']}},'marks':marks,'weights':{},'gioiHan':'Chỉ thử scratch. Soát shaping NFC/NFD giới hạn6chuỗi; không suy browserpixel/nofallback/toànfont/clip hoặc sourcefigureapproval từ cmap/shaping. Cần freshChromium+CDP/read-onlyexacthash riêng.'}
for weight in ['de','dam']:
 ns['tao'](weight,ns['KIEU'][weight]);parts={n:TTFont(out/f'ddh-rounded-{weight}-{n}.woff2')for n in ['latin','vietnamese']};latin,viet=parts['latin'],parts['vietnamese'];lc,vc=latin.getBestCmap(),viet.getBestCmap();overlap=sorted(lc.keys()&vc.keys());paths=[]
 # Chỉ loại cmap trùng sau khi đường nét và advance/LSB THẬT giống hệt; không dựa pHash/area.
 for cp in overlap:
  a=RecordingPen();b=RecordingPen();latin['glyf'][lc[cp]].draw(a,latin['glyf']);viet['glyf'][vc[cp]].draw(b,viet['glyf'])
  assert a.value==b.value and latin['hmtx'][lc[cp]]==viet['hmtx'][vc[cp]],f'Không được gộp glyph trùng khác nét/metrics U+{cp:04X}'
 for name,f in parts.items():
  if name=='vietnamese':
   for table in f['cmap'].tables:
    if table.isUnicode():
     for cp in overlap:table.cmap.pop(cp,None)
  f.flavor=None;p=out/f'merge-{weight}-{name}.ttf';f.save(p);paths.append(str(p))
 f=Merger().merge(paths);ttf=out/f'unified-{weight}.ttf';f.save(ttf);face=hb.Face(ttf.read_bytes());font=hb.Font(face);hb.ot_font_set_funcs(font);checks=[]
 for text in ['ẪẫỄễỖỗ','ẬẲẴẶ','ẮỀỔỠỰ']:
  shaped=[]
  for t in [text,unicodedata.normalize('NFD',text)]:
   buf=hb.Buffer();buf.add_str(t);buf.guess_segment_properties();hb.shape(font,buf);shaped.append([(i.codepoint,p.x_advance,p.x_offset,p.y_offset)for i,p in zip(buf.glyph_infos,buf.glyph_positions)])
  checks.append(dict(text=text,shapingEqual=shaped[0]==shaped[1],gid0=any(g[0]==0 for run in shaped for g in run)))
 f.flavor='woff2';woff=out/f'unified-{weight}.woff2';f.save(woff)
 report['weights'][weight]={'overlapCmapDedup':overlap,'duplicateGlyphsOutlineAndMetricsExact':True,'sourceSubsets':{n:{'sha':hashlib.sha256((out/f'ddh-rounded-{weight}-{n}.woff2').read_bytes()).hexdigest(),'bytes':(out/f'ddh-rounded-{weight}-{n}.woff2').stat().st_size}for n in parts},'unifiedSHA':hashlib.sha256(woff.read_bytes()).hexdigest(),'unifiedBytes':woff.stat().st_size,'checks':checks}
(out/'nfd-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
