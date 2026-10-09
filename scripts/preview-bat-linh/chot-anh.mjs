import {chromium} from 'playwright'
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']})
try{
 const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'})
 await p.goto('http://127.0.0.1:5173/scripts/preview-bat-linh/games.html?game=dao&thu=1&cap=50')
 await p.getByRole('button',{name:/LÊN ĐƯỜNG/}).click();await p.waitForLoadState('networkidle')
 await p.screenshot({path:'/workspace/bat-linh-preview/dao-cau-hoi-390.png',fullPage:true})
 await p.locator('.pa-hang').nth(1).click();await p.getByRole('button',{name:'CHỐT ĐÁP ÁN',exact:true}).click()
 await p.locator('.dao2-ai[data-pha="giai"]').waitFor();await p.waitForLoadState('networkidle')
 await p.screenshot({path:'/workspace/bat-linh-preview/dao-loi-giai-390.png',fullPage:true})
 const css=await p.locator('.dao2-nut-xanh').evaluate(e=>getComputedStyle(e).backgroundImage)
 if(!css.includes('65, 139, 111'))throw new Error('Review button did not adopt jade palette: '+css)
 await p.goto('http://127.0.0.1:5173/scripts/preview-bat-linh/games.html?game=thu&man=dao&thu=1&cap=50')
 await p.locator('.dao-hon .bl-bieu-cam').waitFor();await p.waitForLoadState('networkidle');await p.screenshot({path:'/workspace/bat-linh-preview/than-thu-dao-390.png',fullPage:true})
 console.log('PASS: latest island/feedback/personal island screenshots and jade action color')
}finally{await b.close()}
