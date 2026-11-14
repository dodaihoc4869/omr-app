"""Nguồn139: giữ riêng vị trí từng nhãn, ngoặc và hai đầu sóng."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='189ef68ef4c1a7d34805244c7f96ab6dfa1d6134fc0edd77ce4cb544e47955d9';b='';source=json.loads(Path('/workspace/scratch/source443.json').read_text());g=source['geometry']
def path(d,w=1.7):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#252525" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def line(v):path('M'+'L'.join(f'{x} {y}'for x,y in v))
for key in ['horizontalSingleBonds','CCdoubleRays','verticalBranches']:
 for v in g[key]:line(v)
for j,q in enumerate(g['labels']):
 x0,y0,x1,y1=q['bbox'];y=134 if j<10 else (66 if j in [10,12] else 70 if j==15 else 194 if j<17 else 185)
 b+=F.label(x0,y,q['literal'],24 if j==17 else 32,anchor='start',weight='de',fill='#252525')
path('M280 66C259 100 259 150 280 184 M472 68C493 102 493 152 472 186',1.5)
# Các cực trị không tuần hoàn lấy riêng theo ảnh nguồn; không suy mắt xích ngoài hai đầu.
for key in ['leftWave','rightWave']:
 q=g[key];points=[q['start']]+q['orderedTurns']+[q['end']];d=f'M{points[0][0]} {points[0][1]}'
 for i,((x0,y0),(x1,y1))in enumerate(zip(points,points[1:])):
  dx=(x1-x0)/2;d+=f'C{x0+dx} {y0} {x1-dx} {y1} {x1} {y1}'
 path(d,2)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="243" viewBox="0 0 1040 243"><title>Đoạn mạch theo nguồn139</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='butyl139-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='17printedC32printedH=5CH2+1CH+4C+7CH3-SYMBOLICnNOTwholepolymerformula/1CCdouble2rays/7verticalCH3branches3UP4DOWN/2individualROUNDaroundONLYmiddleCH2-Cplus2CH3-1nSUBupright/2wavesEACH4crests4troughs-startDOWNendMID-individualnonperiodicturns/ALLregularUPRIGHT-SUB23-FIRSTCanchors/0arrow-stereo-charge-caption/noaddedH-monomer-name98percent2percent-answer/noalias481/nativeapproxNOTsubpixel/faintscangridNOTchemicalbonds-data'
r=dict(i=139,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-butyl139-native-ddh-lo-443-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');(K/'doc-butyl139-lo-443.json').write_text(json.dumps(dict(hash=h,native=[1040,243],questions=qs,ghiChu=note,independentSourceAudit=source,rootSourceAudit='Root OWN nativeFULL/FULL2x/all1de12-C4-B13-I-49/2waves10x.17C32H explicit labels counted5CH2+1CH+4C+7CH3; n/outsidecutUNKNOWN/no polymer molecularformula.7CH3branches3UP4DOWN/1CCdouble/2ROUNDonlymiddleCH2-C.Eachwave4crests4troughs-startDOWNendMID/nonperiodicnativeguides. ALLregularUPRIGHT. Faint dottedscanbackgroundNOTchemicalbond/data/noinventedcount/noadded98percent2percent-monomeranswer.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
