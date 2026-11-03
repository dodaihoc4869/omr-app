"""Khép bộ sơ đồ chất bề mặt, giữ nhãn gốc và tám đầu hướng vào trong."""
from pathlib import Path
import importlib.util,json,hashlib,xml.etree.ElementTree as E
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());assets=sorted(iv['assets'],key=lambda r:r['hash']);manifest=json.loads((M/'danh-muc-da-kiem.json').read_text());rows=[];E.register_namespace('','http://www.w3.org/2000/svg')
def base(i):return (M/manifest['theoHashNguon'][assets[i]['hash']]['tep']).read_bytes()
def inward():
 b=''
 for k in range(8):
  d='M84 0Q91 12 98 0';x=98
  for z in range(11):x+=14;d+=f'T{x} 0'
  b+=f'<g transform="translate(300 300) rotate({k*45})"><path d="{d}" stroke="#252440" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="65" cy="0" r="19" fill="#252440"/></g>'
 return ('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><title>Sơ đồ tám phân tử theo nguồn</title>'+b+'</svg>').encode()
for i in[836,1103,312,1055,891,329,701,1042]:
 caption={836:'A.',1103:'B.',312:'C.',1055:'D.'}.get(i)
 if i in[836,1103,312,891]:raw=base({836:369,1103:283,312:242,891:242}[i])
 elif i in[1055,329,701]:raw=inward()
 else:
  b='<path d="M15 160H820" stroke="#252440" stroke-width="2"/>'
  for x in[220,420,620]:b+=f'<path d="M{x} 20V160" stroke="#252440" stroke-width="2.5"/><circle cx="{x}" cy="205" r="45" fill="none" stroke="#252440" stroke-width="3"/>'
  b+=F.label(805,65,'Không khí',37)+F.label(1100,165,'Bề mặt phân chia',37)+F.label(770,290,'Nước',37)
  raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="320" viewBox="0 0 1320 320"><title>Phân tử tại bề mặt phân chia theo nguồn</title>'+b+'</svg>').encode()
 if caption:
  root=E.fromstring(raw);w=int(root.attrib['width']);h=int(root.attrib['height'])+90;root.set('height',str(h));root.set('viewBox',f'0 0 {w} {h}');root.append(E.fromstring(F.label(20,h-25,caption,42,'start',weight='dam')));raw=E.tostring(root,encoding='utf-8')
 hh=hashlib.sha256(raw).hexdigest();fn=next((v['tep']for v in manifest['theoHashNguon'].values()if v['hashSvg']==hh),'khep-be-mat-ddh-'+hh+'.svg');(M/fn).write_bytes(raw);a=assets[i];qs=[]
 for q in iv['questions']:
  refs=[h for h in q['hinh']if h['hash']==a['hash']]
  if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
 rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],questions=qs,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',ghiChuDung='GiữA./B./C./D.củabộsource/câudẫnkhôngbỏnhãn.8head/tail,hướngđúngtừngPA.1042chỉ3headrỗngdướibiên/3tailthẳngtrên,đủ3nhãnsource.'))
(M/'cau-truc-khep-be-mat-ddh-lo-105-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
