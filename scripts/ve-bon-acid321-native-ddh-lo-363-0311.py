"""Bốn mạch acid nguồn321: giữ riêng số đỉnh và nối đôi từng hàng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='37423984c506c2524a8581e31ca1bfb54ca597a91a4b5cba4a473a9804af7415';b=''
rows=[[[7, 38], [22, 14], [36, 38], [64, 38], [78, 14], [92, 38], [120, 38], [135, 14], [149, 38], [177, 38], [191, 14], [205, 38], [233, 38], [247, 14], [262, 38], [289, 38], [304, 14], [318, 38], [332, 14]], [[9, 117], [23, 93], [37, 117], [51, 93], [65, 117], [79, 93], [107, 93], [122, 117], [136, 93], [150, 117], [164, 93], [178, 117], [192, 93]], [[9, 192], [23, 168], [37, 192], [51, 168], [65, 192], [79, 168], [107, 168], [122, 192], [136, 168], [164, 168], [178, 192], [192, 168], [206, 192], [220, 168], [234, 192], [248, 168], [262, 192]], [[7, 261], [21, 237], [35, 261], [49, 237], [63, 261], [77, 237], [105, 237], [120, 261], [134, 237], [162, 237], [176, 261], [190, 237], [218, 237], [232, 261], [246, 237], [260, 261], [274, 237], [288, 261], [302, 237]]]
def line(v,w):return f'<path d="M{v[0]} {v[1]}L{w[0]} {w[1]}" stroke="#000" stroke-width="1.5" fill="none"/>'
for row,end in zip(rows,[[341, 29], [201, 108], [271, 176], [311, 252]]):
 for v,w in zip(row,row[1:]):b+=line(v,w)
 b+=line(row[-1],end)
for v,w in [[[39, 33], [61, 33]], [[95, 33], [117, 33]], [[152, 33], [174, 33]], [[208, 33], [230, 33]], [[265, 33], [286, 33]], [[82, 98], [104, 98]], [[82, 173], [104, 173]], [[139, 173], [161, 173]], [[80, 242], [102, 242]], [[137, 242], [159, 242]], [[193, 242], [215, 242]]]:b+=line(v,w)
for x,y in [(347,42),(207,121),(278,171),(319,265)]:b+=F.label(x-F.advance('C',16)/2,y,'COOH',16,anchor='start',fill='#000')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="398" height="277" viewBox="0 0 398 277"><title>Bốn mạch acid theo nguồn321</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bon-acid321-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=321,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4OPENchains19-13-17-19bareC+COOHfirstC=20-14-18-20C/5-1-2-3CCdouble/72C8Ototal/4literalcondensedCOOHregularUPRIGHT-firstCanchors/row3COOHUPothersDOWN/0stereo0arrows/no18Cnormalize-expandedCO-H-names-omegaanswer')
(K/'cau-truc-bon-acid321-native-ddh-lo-363-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
