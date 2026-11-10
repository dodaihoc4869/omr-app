"""Nguồn1421: chín đỉnh mạch chính và bốn phenyl, không chuẩn hoá đơn vị lặp."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ff00ffacd27fccf862b13b12d118d3110e51224235b780473cf6ab2d2052393a';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d):return f'<path d="{d}" fill="none" stroke="#111" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'
b=path('M44 175L83 195L119 175L155 195L191 175L228 195L264 175L300 195L336 175L372 195L405 175 M119 175V133 M228 195V237 M264 175V133 M372 195V237')
for x in [119,264]:
 b+=path(f'M{x} 50L{x+36} 71V112L{x} 133L{x-36} 112V71Z M{x-26} 73L{x-2} 59 M{x+29} 78V105 M{x-26} 111L{x-2} 124')
for x in [228,372]:
 b+=path(f'M{x} 237L{x+36} 258V299L{x} 320L{x-36} 299V258Z M{x+2} 246L{x+26} 260 M{x-29} 265V292 M{x+26} 298L{x+2} 312')
b+=path('M43 149L42 150 C47 151 47 156 42 157 C47 158 47 163 42 164 C47 165 47 170 42 171 C47 172 47 177 42 178 C47 179 47 184 42 185 C47 186 47 189 44 190')
b+=path('M404 158L403 159 C408 160 408 165 403 166 C408 167 408 172 403 173 C408 174 408 179 403 180 C408 181 408 186 403 187 C408 188 408 193 403 194 C408 195 408 198 405 199')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="459" height="367" viewBox="0 0 459 367"><title>Đoạn mạch theo nguồn1421</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polymer-bon-phenyl-native1421-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1421,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4Ph24C12innerdouble+9barebackboneC=33visibleC/branches119UP-228DOWN-264UP-372DOWN/2verticalwaves6RIGHTcrestEACH/cutpointsNOTcarbon/allthin/noaddedH-CH2-brackets-n-caption-answer/no4repeat8Cnormalization')
(K/'cau-truc-polymer-bon-phenyl-native1421-lo-317-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
