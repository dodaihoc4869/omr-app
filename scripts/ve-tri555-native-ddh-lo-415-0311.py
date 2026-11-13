"""Hai triglyceride nguồn555: sáu OOC nguyên văn, sáu mạch riêng."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='6801641f29502072fa9cd415fe808100bb3bf0ab57df518acf6794afa01e6485';b=''
def path(d,w=1.8):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#141414" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.8):path('M'+'L'.join(f'{x} {y}'for x,y in v),w)
def lab(x,y,t,z=25,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#141414')
def first(x,y,t,z=25):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=25):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Sáu mạch riêng giữ các đỉnh không tuần hoàn; không suy từ tên triglyceride.
line([[122,26],[141,13.5],[164,32],[186,13.5],[209,32],[232,13.5],[254,32],[277,13.5],[299,32],[322,13.5],[345,32],[367,13.5],[390,32],[412,13.5],[435,32],[458,13.5]])
line([[122,90],[141,77],[164,95.5],[186,77],[209,95.5],[232,77],[254,95.5],[277,77],[299,95.5],[322,77],[345,95.5],[367,77],[390,95.5],[412,77],[435,95.5],[458,77]])
line([[122,152.5],[141,139.5],[164,158],[186,139.5],[209,158],[232,139.5],[254,158],[277,139.5],[299,158],[322,139.5],[345,158],[367,139.5],[390,158],[412,139.5],[435,158],[458,139.5]])
line([[632,22],[652,11.5],[675,29],[697,11.5],[720,29],[742,11.5],[765,29],[787,11.5],[810,29],[840,29],[862,11.5],[885,29],[907,11.5],[930,29],[952,11.5],[975,29],[997,11.5],[1019,29]])
line([[632,86],[652,75.5],[675,93.5],[697,75.5],[720,93.5],[742,75.5],[765,93.5],[787,75.5],[810,93.5],[840,93.5],[862,75.5],[885,93.5],[907,75.5],[930,93.5],[952,75.5],[975,93.5],[997,75.5],[1019,93.5]])
line([[631,150.5],[651,140],[673,157.5],[696,140],[718,157.5],[741,140],[763,157.5],[783,140],[806,157.5],[837,157.5],[860,140],[882,157.5],[905,140],[927,157.5],[950,140],[973,157.5],[995,140],[1018,157.5]])
# Ba nét trong C=C chỉ có ở Y, hai đầu tự do như ảnh gốc.
line([[810,22],[840,22]],1.8);line([[810,86.5],[840,86.5]],1.8);line([[806,150.5],[837,150.5]],1.8)
# C đầu trong CH/CH2, C cuối trong OOC là điểm neo, không vẽ thêm CO.
for x,y,t in [(13,42,'CH₂'),(13,106,'CH'),(13,168,'CH₂'),(522,39,'CH₂'),(520,104,'CH'),(519,168,'CH₂')]:first(x,y,t)
for x,y in [(113,42),(113,106),(113,168),(622,39),(622,104),(621,168)]:last(x,y,'OOC')
for v in [[[50,31],[65,31]],[[43,96],[63,96]],[[50,156],[65,156]],[[560,29],[574,29]],[[550,94],[572,94]],[[557,156],[571,156]],[[13,47],[13,84]],[[13,112],[13,145]],[[522,44],[521,82]],[[520,110],[519,145]]]:line(v)
lab(243,217,'triglyceride X',26);lab(787,217,'triglyceride Y',26)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="225" viewBox="0 0 1024 225"><title>Hai triglyceride theo nguồn555</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='tri555-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='X51C6O-Y57C6Ototal108C12O/6literalOOC-NOexpandedCO/6individualacylchainsLEFT15bareCplusOOCtextC16EACH-RIGHT17bareCplusOOCtextC18EACH/LEFT0CCdouble-RIGHT3CCdouble1EACH-FREEinnerends/4CH2-FIRSTC2CH-FIRSTC6OOC-LASTCanchors/ALLchemicalAND2captionsregularUPRIGHT-EXACTtriglyceride X-triglyceride Y/NOaddedH-formula-caption-stereo-arrow-answer-alias/nativeapproxNOTsubpixel'
r=dict(i=555,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-tri555-native-ddh-lo-415-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-tri555-lo-415.json').write_text(json.dumps(dict(hash=h,native=[1024,225],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL2x/lefttext5x/allpublicde; X15bareCeach Y17bareCeach plus literalOOC-C/glycerol3each. ALLregularUPRIGHT. NativeapproxNOTsubpixel. IndependentagentinitialCOOCfalsefindingCORRECTEDown3x+rootown5xBEFOREfirstbuilder; noSVGnegativeforsourcecorrection.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
