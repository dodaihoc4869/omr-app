import {it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {MomQuestionStem,MomOption} from '../src/components/MomQuestionMedia'
const img='data:image/png;base64,iVBORw0KGgo='
it('ảnh src trong kho và url bản cũ đều giữ đúng đường dẫn, không img src rỗng',()=>{for(const h of [{src:img},{url:img}]){const html=renderToStaticMarkup(<MomQuestionStem q={{text:'Quan sát thí nghiệm',hinhAnh:[{...h,viTri:'sau_de'}]}}/>);expect(html).toContain(`src="${img}"`);expect(html).toContain('Quan sát thí nghiệm');expect(html).not.toContain('src=""')}})
it('ảnh phụ không thay mất chữ đề; hỗ trợ hinh trong phiếu cũ',()=>{const html=renderToStaticMarkup(<MomQuestionStem q={{text:'Đề nguyên vẹn',imageDataUrl:img,hinh:[{src:'/old.png',viTri:'cuoi_cau'}]}}/>);expect(html).toContain('Đề nguyên vẹn');expect(html).toContain('src="/old.png"')})
it('ảnh phương án ở đúng phương án, không dồn lên thân câu',()=>{const q={text:'Đề',choiceImgs:[img],hinhAnh:[{src:'/A.png',viTri:'sau_pa_A'}]};expect(renderToStaticMarkup(<MomQuestionStem q={q}/>)).not.toContain('/A.png');const html=renderToStaticMarkup(<MomOption q={q} index={0} text="A"/>);expect(html).toContain('/A.png');expect(html).toContain(img)})
