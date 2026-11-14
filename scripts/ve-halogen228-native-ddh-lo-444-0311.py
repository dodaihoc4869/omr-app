"""Nguồn228: hai tia đầu trái có chân riêng, không ép chung đỉnh."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='275940264da9582b4b0595105cda0ac6c77db2e038f6e405c29e04f4121cb14c';b='';source=json.loads(Path('/workspace/scratch/source444.json').read_text());g=source['geometry']
def line(v,w=2.3):
 global b
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+f'" fill="none" stroke="#252525" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
line(g['orderedMainChainVertices'])
line([[31,136],[92,104.5]])
# Chân dưới tính giao với cánh phải xấp xỉ; không phải số đo subpixel nguồn.
y=108+(94-92)*30/58;line([[35,142],[94,y]])
line([[332,104],[384,131]])
for v in g['bareMethylBranches']:line(v)
for q in g['halogenBonds']:
 line(q['path']);x0,y0,x1,y1=q['bbox'];b+=F.label(x0,y1,q['literal'],30,anchor='start',weight='de',fill='#252525')
# Dấu ngoài hình chưa rõ ý nghĩa, giữ riêng; không gán điện tích.
line([[510.5,218],[514,218]],.8)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="548" height="246" viewBox="0 0 548 246"><title>Công thức khung nguồn228</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='halogen228-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='10bareC=8mainvertices+2UPmethyl/2Br2Cl/2CCdouble-LEFTupperrayCONTACTverticalstem104.5-lowerCONTACTrightarmCALCULATED94,109.03448/RIGHTinnerrayFREEbothends/ALLregularUPRIGHT-ClcapitalC+lowerl-FIRSTC-FIRSTB/0explicitH-arrow-stereo-charge-caption/isolatedBOTTOMdashUNKNOWNretain-NOTminus/noaddedH-formula-name-percentage-answer/nativeapproxNOTsubpixel'
r=dict(i=228,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-halogen228-native-ddh-lo-444-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');(K/'doc-halogen228-lo-444.json').write_text(json.dumps(dict(hash=h,native=[548,246],questions=qs,ghiChu=note,independentSourceAudit=source,rootSourceAudit='RootOWNnativeFULL3x/all1de11-C5-B19-III-1/left8x-right6x/pixelrows102..114x89..97.10C=8main+2methylnotfromname;2Br2ClregularUPRIGHT capitalC+lowerl. LEFTupperrayjoinsstem104–105/lowerjoinsrightarm109–111; agentoldgenericraywrongcorrectBEFOREfirstbuilder/oldnewaudit retained. Lowerfoot94,109.03448275862068 CALCULATEDfromapproxarm92,108→150,138 NOT nativeSubpixel. RIGHTinnerrayFREEbothends. IsolatedbottomdashUNKNOWNkeepNOTcharge. NoaddedH-massformula-percent-answer.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
