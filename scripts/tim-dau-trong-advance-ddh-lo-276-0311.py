"""Tìm bố trí dấu trong advance, chỉ thử nghiệm hữu hạn, không sửa font production."""
from pathlib import Path
import sys,json,copy,argparse,hashlib
a=argparse.ArgumentParser();a.add_argument("--font-dir",required=True);a.add_argument("--deps",required=True);a.add_argument("--out",required=True);o=a.parse_args()
sys.path.insert(0,o.deps)
import pathops,math
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
b=Path(o.out);b.mkdir(parents=True,exist_ok=True);out=[];inputs={}
def subsetpath(g,indices):
 h=copy.deepcopy(g);starts=[0]+[x+1 for x in g.endPtsOfContours[:-1]];co=[];fl=[];ep=[]
 for i in indices:
  a=starts[i];z=g.endPtsOfContours[i]+1;co+=list(g.coordinates[a:z]);fl+=list(g.flags[a:z]);ep.append(len(co)-1)
 h.coordinates=GlyphCoordinates(co);h.flags=bytearray(fl);h.endPtsOfContours=ep;h.numberOfContours=len(ep);p=pathops.Path();h.draw(p.getPen(),None);return p

def inflate(p,d):
 q=pathops.Path(p);q.stroke(d*2,pathops.LineCap.ROUND_CAP,pathops.LineJoin.ROUND_JOIN,4);q.convertConicsToQuads(.01);return pathops.op(p,q,pathops.PathOp.UNION)
def collide(a,b):return bool(list(pathops.op(a,b,pathops.PathOp.INTERSECTION).verbs))
for s,gap in [('de',12),('dam',26)]:
 fp=Path(o.font_dir)/('unified-'+s+'.woff2');digest=hashlib.sha256(fp.read_bytes()).hexdigest();assert digest=={'de':'ec3c249d69edb5e97f3079b7a19f9f485739f8cf2e8152edea25107370658e37','dam':'c5f78fb3b1b7c81683b170c1ae8adaf24fd0b9b0f2022d6d4e068deb2b0ee123'}[s];inputs[s]=digest;f=TTFont(fp);cm=f.getBestCmap()
 for ch,nb in [('Ẫ',2),('Ễ',1),('Ỗ',2)]:
  g=f['glyf'][cm[ord(ch)]];aw=f['hmtx'].metrics[cm[ord(ch)]][0];body=inflate(subsetpath(g,list(range(nb))),gap/2);marks=[subsetpath(g,[i])for i in range(nb,g.numberOfContours)];expanded=[inflate(p,gap/2)for p in marks]
  if s=='de' and ch=='Ẫ':continue
  for top in [1000]:
   for xs in [['allinkwithinadvance-step8']]:
    pools=[];witness=[];tested=0
    for mi,p in enumerate(expanded):
     raw=marks[mi].bounds;pool=[];maxmin=top-(raw[3]-raw[1]);minmin=550
     for dx in range(math.ceil(-raw[0]),math.floor(aw-raw[2])+1,8):
      for low in range(minmin,int(maxmin)+1,5):
       dy=low-raw[1];q=p.transform(1,0,0,1,dx,dy);tested+=1
       if collide(body,q):
        if len(witness)<1:witness.append({'type':'body-mark','mark':mi,'dx':dx,'dy':dy,'rawBounds':marks[mi].transform(1,0,0,1,dx,dy).bounds})
       else:pool.append((dx,dy,q))
     pools.append(pool)
    pairs=0;best=None;pairWitness=None;relcache={}
    for a in pools[0]:
     for z in pools[1]:
      pairs+=1
      key=(z[0]-a[0],z[1]-a[1]);hit=relcache.get(key)
      if hit is None:
       hit=collide(expanded[0],expanded[1].transform(1,0,0,1,key[0],key[1]));relcache[key]=hit
      if hit and pairWitness is None:pairWitness={'translations':[[a[0],a[1]],[z[0],z[1]]],'intersectionBounds':pathops.op(a[2],z[2],pathops.PathOp.INTERSECTION).bounds}
      if not hit:
       cost=abs(a[0])+abs(z[0])+abs(a[1])+abs(z[1])
       if best is None or cost<best['cost']:best={'cost':cost,'translations':[[a[0],a[1]],[z[0],z[1]]]}
    out.append({'style':s,'glyph':ch,'headroomTop':top,'xGrid':xs,'advance':aw,'xDomainPerMark':[[-marks[j].bounds[0],aw-marks[j].bounds[2]]for j in range(2)],'yStep':5,'yMinMarkBottom':550,'curveGap':gap,'bodyMarkTests':tested,'bodyClearPools':list(map(len,pools)),'markPairTests':pairs,'uniqueRelativeIntersectionTests':len(relcache),'best':best,'interMarkCollisionWitness':pairWitness,'firstCollisionWitness':witness,'collisionPredicate':'INTERSECTION of halfgap ROUND-stroked+filled exact curves nonempty verbs; no area threshold','strokeConicConversionTolerance':.01})
(b/'search-report.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print([(x['style'],x['glyph'],x['headroomTop'],x['xGrid'],x['bodyClearPools'],x['best'])for x in out])

(b/"inputs.json").write_text(json.dumps({"inputs":inputs,"productionAdopt":False,"scope":"bounded withinadvance step8/y5 only; geometrypositive is not design or appfit admission"},indent=2))
