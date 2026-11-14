from pathlib import Path
import json, hashlib, importlib.util
G=Path(__file__).resolve().parents[1]; K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py'); F=importlib.util.module_from_spec(s); s.loader.exec_module(F)
h='1498cb472401523071522452a43236405e6fb658eca546322f3bc2f08c4f24a2'; b=''
def path(points,w=1.5):
 global b
 d='M'+'L'.join(f'{x} {y}'for x,y in points)
 b+=f'<path d="{d}" fill="none" stroke="#303030" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=29,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#303030')
src={'i': 109, 'assetIndex': 515, 'hash': '1498cb472401523071522452a43236405e6fb658eca546322f3bc2f08c4f24a2', 'source': '/workspace/omr-vector/docs/hinh-vector-0311/nguon/anh/1498cb472401523071522452a43236405e6fb658eca546322f3bc2f08c4f24a2.png', 'size': [437, 315], 'manifestPresent': False, 'publicQuestions': [{'qid': '12-C8-B27-I-26', 'de': 'Phức chất [Fe(OH₂)₆]³⁺ có cấu tạo như hình bên dưới.\nSố liên kết cho – nhận mà nguyên tử trung tâm iron tạo được với các phối tử OH₂ là', 'allHinh': [{'hash': '1498cb472401523071522452a43236405e6fb658eca546322f3bc2f08c4f24a2', 'where': '12-C8-B27-I-26.hinh.0.du_lieu', 'hashDataUrl': 'd6c5c34dd8ea66347575f724f738f712d44fe63599dec8ae73116ac17a39e702'}], 'missingHashes': ['1498cb472401523071522452a43236405e6fb658eca546322f3bc2f08c4f24a2']}], 'fullClosure': {'futureFullIfPassed': 1, 'onlyThisHinh': True}, 'review': {'nativeFullOpened': True, 'ownMacrosOpened': ['/workspace/scratch/449-109-full3x.png'], 'allPublicDeRead': True, 'answersRead': False}, 'geometry': {'centerAtom': {'literal': 'Fe', 'bbox': [192, 142, 222, 163], 'center': [207, 152.5]}, 'ligands': [{'position': 'top', 'literal': 'OH₂', 'bbox': [196, 61, 249, 87], 'Ocenter': [207, 72], 'anchor': 'first O', 'bond': [[207, 87], [207, 139]]}, {'position': 'upperleft', 'literal': 'H₂O', 'bbox': [97, 102, 147, 128], 'Ocenter': [138, 112], 'anchor': 'last O', 'bond': [[152, 119], [189, 141]]}, {'position': 'lowerleft', 'literal': 'H₂O', 'bbox': [97, 181, 147, 208], 'Ocenter': [138, 192], 'anchor': 'last O', 'bond': [[151, 183], [189, 163]]}, {'position': 'upperright', 'literal': 'OH₂', 'bbox': [276, 102, 326, 128], 'Ocenter': [285, 112], 'anchor': 'first O', 'bond': [[225, 145], [272, 119]]}, {'position': 'lowerright', 'literal': 'OH₂', 'bbox': [276, 181, 326, 208], 'Ocenter': [285, 192], 'anchor': 'first O', 'bond': [[226, 161], [272, 183]]}, {'position': 'bottom', 'literal': 'OH₂', 'bbox': [196, 222, 249, 248], 'Ocenter': [207, 233], 'anchor': 'first O', 'bond': [[207, 167], [207, 218]]}], 'squareBrackets': {'left': [[65, 45], [47, 45], [47, 273], [65, 273]], 'right': [[341, 44], [356, 44], [356, 272], [341, 272]], 'strokeWidth': 1.5}, 'charge': {'literal': '3+', 'bbox': [364, 42, 397, 63], 'baseline': 61, 'position': 'superscript atupperright of square'}, 'counts': {'Fe': 1, 'O': 6, 'H': 12, 'singleBonds': 6, 'squareBracketStrokes': 2, 'charge': '3+', 'wedge': 0, 'hashed': 0, 'heads': 0, 'explanation': 'Two H₂O labels onleft andfourOH₂ top/bottom/right, exactsourceorder retained. All sixligandbondsuniformsingle lines, no dativedirectionhead added.'}, 'styles': {'labels': 'regular upright sans Fe/H/O/3+, no truebold oritalic observed', 'subscript': '2lowered afterH', 'bonds': 'grayblack about1.3–1.8px uniform', 'caption': 'NONE'}, 'crop': 'Allbrackets/countercharge/labels insidecanvas, no clippedfragments/UNKNOWNmarks'}, 'measurementLimits': 'Nativeapprox±1–2px eachlabel/bond/bracket independently. No symmetricclone ofbonds: upperright/lowerright endpoint y145/161 asnative Feedge. LastOanchorforH2O, firstOforOH2; do not change OH2labels to conventionalH2O by theory.', 'status': 'source-only/noSVG/noCount', 'actualSvgReviewed': False}
# Sáu nét riêng theo nguồn, không thêm đầu mũi tên cho liên kết phối trí.
for lig in src['geometry']['ligands']:path(lig['bond'],1.6)
for pts in src['geometry']['squareBrackets'].values():
 if isinstance(pts,list):path(pts,1.5)
lab(207,163,'Fe',29)
for lig in src['geometry']['ligands']:
 x,y=lig['Ocenter']; t=lig['literal']; z=29
 if t=='OH₂': lab(x-F.advance('O',z)/2,y+10,t,z,'start')
 else:lab(x+F.advance('O',z)/2-F.advance(t,z),y+10,t,z,'start')
lab(363,62,'3+',27,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="437" height="315" viewBox="0 0 437 315"><title>Phức chất nguồn109</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='fe109-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
assert len(qs)==1 and qs[0]['qid']=='12-C8-B27-I-26'
note='1Fe6O12H/6individualuniformsinglebonds/2LEFTliteralH₂O-LASTO-4TOPBOTTOMRIGHTliteralOH₂-FIRSTO/2SQUARE-3plusSUP/ALLregularUPRIGHT-SUB2/0arrows-wedges-caption/NOaddedliganddirection-answer/nativeapproxNOTsubpixel'
r=dict(i=109,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-fe109-native-ddh-lo-449-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-fe109-lo-449.json').write_text(json.dumps(dict(hash=h,native=[437,315],questions=qs,ghiChu=note,sourceAudit=src,rootSourceAudit='RootOWNnativeFULL/FULL3x/all1publicde. Fe6O12H six uniformsinglebonds, twoLEFT H₂O LASTO and fourOH₂ FIRSTO, squarepair and3plus superscript. AllregularUPRIGHT. No guessed dativedirection/arrows/wedges/answer. Geometry individual nativeapprox, not subpixel.'),ensure_ascii=False,indent=2)+'\n')
print(hh,len(raw))
