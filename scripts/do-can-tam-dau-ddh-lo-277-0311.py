"""Đo quan hệ tâm bao nét của mũ–ngã; chỉ là bằng chứng thiết kế, không đặt cổng duyệt."""
from pathlib import Path
import sys,json,copy,argparse,hashlib
ap=argparse.ArgumentParser();ap.add_argument('--source-dir',required=True);ap.add_argument('--r4-dir',required=True);ap.add_argument('--de269',required=True);ap.add_argument('--de276',required=True);ap.add_argument('--deps',required=True);ap.add_argument('--out',required=True);args=ap.parse_args()
sys.path.insert(0,args.deps)
import pathops
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
b=Path(args.out);b.mkdir(parents=True,exist_ok=True)
def path(g,inds):
 starts=[0]+[e+1 for e in g.endPtsOfContours[:-1]];co=[];fl=[];ep=[]
 for j in inds:a=starts[j];z=g.endPtsOfContours[j]+1;co+=list(g.coordinates[a:z]);fl+=list(g.flags[a:z]);ep.append(len(co)-1)
 h=copy.deepcopy(g);h.coordinates=GlyphCoordinates(co);h.flags=bytearray(fl);h.endPtsOfContours=ep;h.numberOfContours=len(ep);p=pathops.Path();h.draw(p.getPen(),None);return p

def measure(f,ch,body,tilde,hat,label):
 n=f.getBestCmap()[ord(ch)];g=f['glyf'][n];parts=[path(g,x).bounds for x in [body,[tilde],[hat]]];centers=[(x[0]+x[2])/2 for x in parts];adv=f['hmtx'].metrics[n][0];return {'asset':label,'glyph':ch,'advance':adv,'curveBounds':dict(zip(['body','tilde','hat'],parts)),'bboxCenterX':dict(zip(['body','tilde','hat'],centers)),'tildeMinusBody':centers[1]-centers[0],'hatMinusBody':centers[2]-centers[0],'tildeMinusHat':centers[1]-centers[2],'pairSeparationOverAdvance':abs(centers[1]-centers[2])/adv,'offsetDefinition':'curveinkboundsmidpoint; not area centroid or opticalgate'}
rows=[]
for s,w in [('de','Regular'),('dam','Medium')]:
 f=TTFont(str(Path(args.source_dir)/('MPLUSRounded1c-'+w+'.ttf')))
 for ch,body,ti,hi in [('Ẫ',[2,3],0,1),('ẫ',[2,3],0,1),('Ễ',[2],0,1),('ễ',[2,3],0,1),('Ỗ',[2,3],0,1),('ỗ',[2,3],0,1)]:rows.append(measure(f,ch,body,ti,hi,s+'-originalTTF'))
 f=TTFont(str(Path(args.r4_dir)/('unified-'+s+'.woff2')))
 for ch,nb in [('Ẫ',2),('ẫ',2),('Ễ',1),('ễ',2),('Ỗ',2),('ỗ',2)]:rows.append(measure(f,ch,list(range(nb)),nb,nb+1,s+'-R4'))
for lo,ch in [('269','Ẫ'),('276','Ẫ'),('276','Ỗ')]:
 f=TTFont(args.de269 if lo=='269'else args.de276);rows.append(measure(f,ch,[0,1],2,3,'de-'+lo))

# Lưu mọi contour nguồn, ánh xạ ngữ nghĩa và kiểm chứng topology thân chữ.
from collections import Counter
sourceAudit=[]
for style,weight in [('de','Regular'),('dam','Medium')]:
 f=TTFont(str(Path(args.source_dir)/('MPLUSRounded1c-'+weight+'.ttf')));cm=f.getBestCmap()
 def signatures(g):
  out=[];start=0
  for e in g.endPtsOfContours:
   flags=[int(v)&1 for v in g.flags[start:e+1]];out.append((len(flags),min(tuple(flags[k:]+flags[:k])for k in range(len(flags)))));start=e+1
  return out
 for ch,body,ti,hi in [('Ẫ',[2,3],0,1),('ẫ',[2,3],0,1),('Ễ',[2],0,1),('ễ',[2,3],0,1),('Ỗ',[2,3],0,1),('ỗ',[2,3],0,1)]:
  gl=f['glyf'][cm[ord(ch)]];base=f['glyf'][cm[ord({'Ẫ':'A','ẫ':'a','Ễ':'E','ễ':'e','Ỗ':'O','ỗ':'o'}[ch])]];sig=signatures(gl);wanted=Counter(signatures(base));selected=Counter(sig[j]for j in body);canonicalMatch=selected==wanted
  nested=[]
  if not canonicalMatch:
   paths=[path(gl,[j])for j in range(gl.numberOfContours)];starts=[0]+[e+1 for e in gl.endPtsOfContours[:-1]]
   nested=[(i,j)for i,p in enumerate(paths)for j in range(gl.numberOfContours)if i!=j and all(p.contains(tuple(pt))for pt in gl.coordinates[starts[j]:gl.endPtsOfContours[j]+1])]
   assert len(nested)==1 and set(nested[0])==set(body),(style,ch,'unexpected source body topology',nested)
  assert len(body)+2==gl.numberOfContours
  sourceAudit.append({'style':style,'glyph':ch,'bodyIndices':body,'tildeIndex':ti,'hatIndex':hi,'canonicalBaseBodyTopologyExact':canonicalMatch,'uniqueNestingFallback':nested,'allContourCurveBounds':[path(gl,[j]).bounds for j in range(gl.numberOfContours)],'allContourPointCounts':[x[0]for x in sig]})
source=[x for x in rows if 'originalTTF'in x['asset']];r4=[x for x in rows if x['asset'].endswith('-R4')];a=next(x for x in rows if x['asset']=='de-269');o=next(x for x in rows if x['asset']=='de-276'and x['glyph']=='Ỗ')
summary={'sourceMaxAbsTildeHatCenterDifference':max(abs(x['tildeMinusHat'])for x in source),'R4MaxAbsTildeHatCenterDifference':max(abs(x['tildeMinusHat'])for x in r4),'DeA269pairSeparation':abs(a['tildeMinusHat']),'DeO276pairSeparation':abs(o['tildeMinusHat']),'DeA269PairSepAdvanceFraction':a['pairSeparationOverAdvance'],'DeO276PairSepAdvanceFraction':o['pairSeparationOverAdvance']}
files=[Path(args.source_dir)/('MPLUSRounded1c-'+w+'.ttf')for w in ['Regular','Medium']]+[Path(args.r4_dir)/('unified-'+s+'.woff2')for s in ['de','dam']]+[Path(args.de269),Path(args.de276)]
report={'nguoiDoc':'soat_nguon_3','repoModified':False,'productionAdopt':False,'candidateCreated':False,'verdict':'HOLD remaining5; corrected semantic source decomposition, descriptive centering evidence only','correction':'Previous sourceẫ indices were post-them_duoi_a order incorrectly applied to nativeTTF. NativeTTF sourceẫ BOTHweights body[2,3],tilde0,hat1. Previous report INVALID; do not use its12sourceclaim.','measurements':rows,'sourceContourAudit':sourceAudit,'summary':summary,'findings':['Corrected12sourcefamily: sourcehat/tilde centers nearly aligned; use actual measured maximum in summary, not oldinvalidreport.','DeẪ269 preserves same pairalignment; DeỖ276 separates marks by297.5units/39.3%advance, consistent with actualdesignnegative.','Body curvebboxmidpoint is not universalopticalcenter; nativeẫ corrected body offsets now must be read fromcorrectedmeasurements. No zerooffset or numericnewgate introduced.','No newgeometryrepair justified, no search/fontbuild/prodadoption. Sourcebodyselection verified canonical cyclicflagtopology or unique sourceoutercontainsinner fallback, not centers alone.'],'assetHashes':{str(p):hashlib.sha256(p.read_bytes()).hexdigest()for p in files},'limits':['curvebboxmidpoint is descriptive, not area centroid/opticalgate','No new actualfontpositive or oldpositive carriedtonewSHA']}
(b/'measurements.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));(b/'centering-design-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(summary,indent=2))
