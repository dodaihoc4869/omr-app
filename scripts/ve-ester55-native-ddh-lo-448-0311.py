from pathlib import Path
import json, hashlib, importlib.util
G=Path(__file__).resolve().parents[1]; K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py'); F=importlib.util.module_from_spec(s); s.loader.exec_module(F)
h='0b13ec2c25674b87dd20990b9893762640cf28c23c0dad6ead169a56f2e44e28'; b=''
def path(d,w=1.8):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt"/>'
def lab(x,y,t,z=34,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def first(x,y,t,z=34):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
# Mọi nguyên tử C carbonyl đều in chữ: giữ khoảng trắng trước/sau hai tia.
path('M105 64L117 64M148 64L159 64M127 80L127 96M134 80L134 96')
path('M634 65L644 65M677 65L683 65M714 65L726 65M655 81L655 96M662 81L662 96')
first(52,76,'CH₃',34);lab(132,76,'C',36);first(175,76,'OH',36);lab(238,75,'+',34)
lab(258,74,'CH₃CH₂OH',33,'start');lab(132.5,126,'O',36)
first(585,77,'CH₃',32);lab(660,78,'C',34);lab(697.5,78,'O',34)
first(741,77,'CH₂CH₃',31);lab(660.5,126,'O',36);lab(878,75,'+',34);lab(897,74,'H₂O',34,'start')
path('M434 61L550 61M434 68L550 68',1.6)
b+='<path d="M542 58L550 61L542 61Z M434 68L442 68L442 72Z" fill="#000000"/>'
condition='H₂SO₄ đặc, t';z=17.5;x=432
lab(x,47,condition,z,'start');lab(x+F.advance(condition,z)+1,39.5,'o',11,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="992" height="159" viewBox="0 0 992 159"><title>Phản ứng nguồn55</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest(); fn='ester55-native-ddh-'+hh+'.svg'; (K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text()); qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs: qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
assert len(qs)==1 and qs[0]['qid']=='11-C3-B10-II-1'
note='8C6O20printedH-EXCLcondition/2explicitCOvertical2raysWHITEglyphgaps/2HALFfilledharpoonsUPPERRIGHTABOVE-LOWERLEFTBELOW/EXACTCH₃-C-OH+CH₃CH₂OH-CH₃-C-O-CH₂CH₃+H₂O/H₂SO₄ đặc,tSUPo/ALLregularUPRIGHT-SUB234/noexpandedcondensedethanol/noaddedH-IRtable-names-answer/nativeapproxNOTsubpixel'
r=dict(i=55,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-ester55-native-ddh-lo-448-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-ester55-lo-448.json').write_text(json.dumps(dict(hash=h,native=[992,159],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/FULL3x/heads10x/all1publicde.8C6O20printedH EXCLcondition.2explicitC carbonylWHITEglyphgaps; 2HALFfilledharpoons notFULLtriangles. AllregularUPRIGHT. Publicde mentions table but inventoryONLY1hinh; no inventedpartner/no tablecheckedclaim. No addedIRdata-answer-caption.'),ensure_ascii=False,indent=2)+'\n')
print(hh,len(raw))
