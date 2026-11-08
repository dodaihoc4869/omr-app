#!/usr/bin/env python3
"""CHỈ THỬ NGHIỆM 3 GLYPH: chưa sửa font sản phẩm, chưa duyệt toàn bộ.
Phụ thuộc fonttools[woff], skia-pathops; không tải hoặc thay đổi đầu vào.
Dùng đúng môi trường của bộ tạo font khi tái lập cấu hình riêng.
"""
import sys,copy,json,pathlib,hashlib,argparse,platform,os
from importlib.metadata import version
parser=argparse.ArgumentParser(description=__doc__)
for name in ('source','generator','actual','out'): parser.add_argument('--'+name,required=True,type=pathlib.Path)
args=parser.parse_args()
for path in (args.source,args.generator,args.actual):
 if not path.is_file(): parser.error('Missing input: '+str(path))
args.out.mkdir(parents=True,exist_ok=True)
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter,Options
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.recordingPen import RecordingPen
import pathops
root=args.out
sys.argv=['test',str(root),str(root)]
generatorWhole=args.generator.read_bytes();code=generatorWhole.decode().split('os.makedirs(RA, exist_ok=True)')[0];ns={};exec(compile(code,str(args.generator),'exec'),ns)
f=TTFont(args.source);s=Subsetter(Options());s.populate(text='NAa');s.subset(f);cm=f.getBestCmap();k=ns['KIEU']['dam'].copy();stages={}
def snap(n,font):
 q=copy.deepcopy(font);o=Options();o.hinting=False;s=Subsetter(o);s.populate(text='NAa');s.subset(q);q.flavor='woff2';q.save(root/(n+'.woff2'));stages[n]={'sha':hashlib.sha256((root/(n+'.woff2')).read_bytes()).hexdigest(),'metrics':{c:q['hmtx'][q.getBestCmap()[ord(c)]] for c in 'NAa'}}
def sig(font,c):
 g=font['glyf'];n=font.getBestCmap()[ord(c)];p=RecordingPen();g[n].draw(p,g);return p.value
snap('0-source',f)
ns['them_duoi_a'](f,cm,ns['DUOI_A']['Dam']);snap('1-after-a',f)
before=copy.deepcopy(f)
ns['lam_dam'](f,k['net']);snap('2-after-offset',f)
k=dict(k,theo=k['theo']+2*k['net']*k['sx']);ns['bien_doi'](f,k);snap('3-after-transform',f)
actual=TTFont(args.actual)
match={c:sig(actual,c)==sig(f,c) for c in 'NAa'}
# Đối chứng bỏ offset, giữ cùng bước dựng a và phép biến đổi.
z=copy.deepcopy(before);ns['bien_doi'](z,k);snap('4-no-offset',z)
# Thử giãn nét theo đường cong bằng hợp stroke; không lọc diện tích.
z=copy.deepcopy(before);g=z['glyf']
for c in 'NAa':
 n=z.getBestCmap()[ord(c)];p=pathops.Path();g[n].draw(p.getPen(),g);p.simplify(fix_winding=True);stroke=pathops.Path(p);stroke.stroke(2*ns['NET_DAM'],pathops.LineCap.ROUND_CAP,pathops.LineJoin.ROUND_JOIN,4);stroke.convertConicsToQuads(0.1);p=pathops.op(p,stroke,pathops.PathOp.UNION);pen=TTGlyphPen(g);p.draw(Cu2QuPen(pen,0.5,reverse_direction=True));g[n]=pen.glyph()
ns['bien_doi'](z,k)
# Giữ advance/LSB bản hiện tại để so thử nghiệm; không sửa app.
for c in 'NAa':
 n=z.getBestCmap()[ord(c)];fn=f.getBestCmap()[ord(c)];z['hmtx'][n]=f['hmtx'][fn]
snap('5-curve-aware-experiment',z)

for name, data in stages.items():
 q=TTFont(root/(name+'.woff2'));data['glyphBounds']={}
 for c in 'NAa':
  g=q['glyf'][q.getBestCmap()[ord(c)]];g.recalcBounds(q['glyf'])
  data['glyphBounds'][c]=[g.xMin,g.yMin,g.xMax,g.yMax]
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
report={'inputs':{key:{'path':str(getattr(args,key).resolve()),'sha256':sha(getattr(args,key))} for key in ('source','generator','actual')},
 'scriptSHA':sha(pathlib.Path(__file__)),
 'executedGeneratorPrefixSHA':hashlib.sha256(code.encode()).hexdigest(),
 'dependencies':{'python':platform.python_version(),**{n:version(n) for n in ('fonttools','skia-pathops','brotli')}},
 'DDHEnvironment':{k:v for k,v in os.environ.items() if k.startswith('DDH_')},
 'settings':k,'matchesActualCurrentGlyphExact':match,'stages':stages,
 'metricAndBBoxEqualityCurrentVsExperimental':{c:{'metricsEqual':stages['3-after-transform']['metrics'][c]==stages['5-curve-aware-experiment']['metrics'][c], 'bboxEqual':stages['3-after-transform']['glyphBounds'][c]==stages['5-curve-aware-experiment']['glyphBounds'][c]} for c in 'NAa'},
 'admissible':False,'scope':'Three glyph causal experiment only; no font/subset published; no tiny-contour or area threshold. Current hmtx explicitly preserved for experiment5; bbox independently compared. Full glyph/diacritic/app-size independent review still required.'}
json.dump(report,open(root/'reproduction.json','w'),ensure_ascii=False,indent=2)
print(json.dumps({'matchesCurrentOutline':match,'metricsAndBounds':report['metricAndBBoxEqualityCurrentVsExperimental'],'admissible':False}))
