"""Dùng đúng WOFF2 DDH Rounded của app, dựng chữ thành nét vector tự chứa."""
from pathlib import Path
import hashlib,html,io
from fontTools.ttLib import TTFont
from fontTools.merge import Merger
from fontTools.pens.svgPathPen import SVGPathPen
import uharfbuzz as hb
G=Path(__file__).resolve().parents[1];SRC=G/'src/styles/phong-ddh';CACHE=G/'docs/hinh-vector-0311/ung-vien/phong-ddh';CACHE.mkdir(parents=True,exist_ok=True)
def font(weight='de'):
 paths=[SRC/f'ddh-rounded-{weight}-{s}.woff2'for s in ['latin','vietnamese']];digest=hashlib.sha256(b''.join(p.read_bytes()for p in paths)).hexdigest();target=CACHE/f'{weight}-{digest}.ttf'
 if not target.exists():
  parts=[]
  for k,p in enumerate(paths):
   f=TTFont(p);f.flavor=None;q=CACHE/f'{weight}-{digest}-{k}.ttf';f.save(q);parts.append(str(q))
  Merger().merge(parts).save(target)
 return target,digest
PATH,HASH=font();TT=TTFont(PATH);GLYPHS=TT.getGlyphSet();ORDER=TT.getGlyphOrder();DATA=PATH.read_bytes();FACE=hb.Face(DATA);FONT=hb.Font(FACE);UPM=FACE.upem;FONT.scale=(UPM,UPM);hb.ot_font_set_funcs(FONT)
CONTEXTS={}
def _context(weight):
 if weight=='de':return TT,GLYPHS,ORDER,FONT,UPM
 if weight not in CONTEXTS:
  path,_=font(weight);tt=TTFont(path);face=hb.Face(path.read_bytes());shaper=hb.Font(face);upm=face.upem;shaper.scale=(upm,upm);hb.ot_font_set_funcs(shaper)
  CONTEXTS[weight]=(tt,tt.getGlyphSet(),tt.getGlyphOrder(),shaper,upm)
 return CONTEXTS[weight]
def label(x,y,s,size=24,anchor='middle',fill='#252440',extra='',weight='de'):
 tt,glyphs,order,shaper,upm=_context(weight)
 if weight!='de':extra='data-weight="'+weight+'" '+extra
 missing=[c for c in s if ord(c)not in tt.getBestCmap()]
 if missing:raise ValueError('Phông app thiếu ký tự '+repr(missing))
 buf=hb.Buffer();buf.add_str(s);buf.guess_segment_properties();hb.shape(shaper,buf);advance=sum(p.x_advance for p in buf.glyph_positions);scale=size/upm;offset=advance*scale*({'middle':.5,'end':1}.get(anchor,0));parts=[];cursor=0
 for info,pos in zip(buf.glyph_infos,buf.glyph_positions):
  if info.codepoint==0:raise ValueError('Không được dùng glyph thiếu')
  pen=SVGPathPen(glyphs);glyphs[order[info.codepoint]].draw(pen);d=pen.getCommands()
  if d:parts.append(f'<path d="{d}" transform="translate({x-offset+(cursor+pos.x_offset)*scale:.5f} {y-pos.y_offset*scale:.5f}) scale({scale:.7f} {-scale:.7f})"/>')
  cursor+=pos.x_advance
 return f'<g fill="{fill}" aria-label="{html.escape(s,quote=True)}" data-font="DDH Rounded" {extra}>'+''.join(parts)+'</g>'
def advance(s,size,weight='de'):
 _,_,_,shaper,upm=_context(weight)
 buf=hb.Buffer();buf.add_str(s);buf.guess_segment_properties();hb.shape(shaper,buf);return sum(p.x_advance for p in buf.glyph_positions)*size/upm
