"""Tìm dịch dấu trên lưới hữu hạn bằng giao nét cong; không hạ ngưỡng diện tích/không sửa production."""
from pathlib import Path
import sys,json,copy,argparse,hashlib
p=argparse.ArgumentParser();p.add_argument('--font-dir',type=Path,required=True);p.add_argument('--out',type=Path,required=True);args=p.parse_args()

import pathops
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
b=args.out;b.mkdir(parents=True,exist_ok=True);out=[]
def subsetpath(g,indices):
 h=copy.deepcopy(g);starts=[0]+[x+1 for x in g.endPtsOfContours[:-1]];co=[];fl=[];ep=[]
 for i in indices:
  a=starts[i];z=g.endPtsOfContours[i]+1;co+=list(g.coordinates[a:z]);fl+=list(g.flags[a:z]);ep.append(len(co)-1)
 h.coordinates=GlyphCoordinates(co);h.flags=bytearray(fl);h.endPtsOfContours=ep;h.numberOfContours=len(ep);p=pathops.Path();h.draw(p.getPen(),None);return p

def inflate(p,d):
 q=pathops.Path(p);q.stroke(d*2,pathops.LineCap.ROUND_CAP,pathops.LineJoin.ROUND_JOIN,4);q.convertConicsToQuads(.01);return pathops.op(p,q,pathops.PathOp.UNION)
def collide(a,b):return bool(list(pathops.op(a,b,pathops.PathOp.INTERSECTION).verbs))
for s,gap in [('de',12),('dam',26)]:
 fontpath=args.font_dir/('unified-'+s+'.woff2');expected={'de':'ec3c249d69edb5e97f3079b7a19f9f485739f8cf2e8152edea25107370658e37','dam':'c5f78fb3b1b7c81683b170c1ae8adaf24fd0b9b0f2022d6d4e068deb2b0ee123'};assert hashlib.sha256(fontpath.read_bytes()).hexdigest()==expected[s];f=TTFont(fontpath);cm=f.getBestCmap()
 for ch,nb in [('Ẫ',2),('Ễ',1),('Ỗ',2)]:
  g=f['glyf'][cm[ord(ch)]];body=inflate(subsetpath(g,list(range(nb))),gap/2);marks=[subsetpath(g,[i])for i in range(nb,g.numberOfContours)];expanded=[inflate(p,gap/2)for p in marks]
  for top in [930,950,970,1000]:
   for xs in [[0],[-24,-12,0,12,24]]:
    pools=[];witness=[];tested=0
    for mi,p in enumerate(expanded):
     raw=marks[mi].bounds;pool=[];maxmin=top-(raw[3]-raw[1]);minmin=550
     for dx in xs:
      for low in range(minmin,int(maxmin)+1,5):
       dy=low-raw[1];q=p.transform(1,0,0,1,dx,dy);tested+=1
       if collide(body,q):
        if len(witness)<1:witness.append({'type':'body-mark','mark':mi,'dx':dx,'dy':dy,'rawBounds':marks[mi].transform(1,0,0,1,dx,dy).bounds})
       else:pool.append((dx,dy,q))
     pools.append(pool)
    pairs=0;best=None;pairWitness=None
    for a in pools[0]:
     for z in pools[1]:
      pairs+=1
      hit=collide(a[2],z[2])
      if hit and pairWitness is None:pairWitness={'translations':[[a[0],a[1]],[z[0],z[1]]],'intersectionBounds':pathops.op(a[2],z[2],pathops.PathOp.INTERSECTION).bounds}
      if not hit:
       cost=abs(a[0])+abs(z[0])+abs(a[1])+abs(z[1])
       if best is None or cost<best['cost']:best={'cost':cost,'translations':[[a[0],a[1]],[z[0],z[1]]]}
    out.append({'style':s,'glyph':ch,'headroomTop':top,'xGrid':xs,'yGrid5MinMarkBottom':550,'curveGap':gap,'bodyMarkTests':tested,'bodyClearPools':list(map(len,pools)),'markPairTests':pairs,'best':best,'interMarkCollisionWitness':pairWitness,'firstCollisionWitness':witness,'collisionPredicate':'INTERSECTION of halfgap ROUND-stroked+filled exact curves nonempty verbs; no area threshold','strokeConicConversionTolerance':.01})
(b/'search-report.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print('Đã tìm48trườnghợp hữu hạn;nghiệm',sum(x['best'] is not None for x in out))
# Tái tạo riêngnghiệm DeẪ,khônggán bằngchứng rendercũ cho hash sinh lại.
f=TTFont(args.font_dir/'unified-de.woff2');beforemetrics=dict(f['hmtx'].metrics);beforehhea=f['hhea'].compile(f);beforeos2=f['OS/2'].compile(f)
name=f.getBestCmap()[ord('Ẫ')];g=f['glyf'][name];assert g.numberOfContours==4
solution=next(x for x in out if x['style']=='de'and x['glyph']=='Ẫ'and x['headroomTop']==1000 and x['xGrid']==[0])['best'];assert solution['translations']==[[0,-161.0],[0,-110.0]]
starts=[0]+[v+1 for v in g.endPtsOfContours[:-1]]
for contour,(dx,dy)in zip([2,3],solution['translations']):
 for j in range(starts[contour],g.endPtsOfContours[contour]+1):
  x,y=g.coordinates[j];g.coordinates[j]=(int(x+dx),int(y+dy))
g.recalcBounds(f['glyf']);assert g.yMax==999
assert f['hmtx'].metrics==beforemetrics and f['hhea'].compile(f)==beforehhea and f['OS/2'].compile(f)==beforeos2
path=b/'de-aa-tai-tao-chua-admit.woff2';f.flavor='woff2';f.save(path)
(b/'candidate-repro.json').write_text(json.dumps(dict(sha256=hashlib.sha256(path.read_bytes()).hexdigest(),hmtxExact=True,hheaOS2Exact=True,translations=solution['translations'],targetYmax=999,productionAdopt=False,globalAdmitted=False,oldRenderProofApplies=False),ensure_ascii=False,indent=2)+'\n')
