const { chromium } = require('@playwright/test');

(async () => {
  console.log("Simülasyon başlatılıyor...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: 'videos/', size: { width: 1280, height: 720 } }
  });
  
  const page = await context.newPage();
  
  console.log("Sayfaya gidiliyor...");
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000); // Yüklenme payı
  
  console.log("Elastik fizik motoru test ediliyor (Mouse Hover)...");
  
  // Mouse hareketleri - Repulse (itme) ve geri yaylanma (elastic) testi
  await page.mouse.move(640, 360, { steps: 20 });
  await page.waitForTimeout(500); // Bekle ve nodların eski haline dönmesini (snapping) izle
  
  await page.mouse.move(300, 200, { steps: 20 });
  await page.waitForTimeout(500);
  
  await page.mouse.move(900, 500, { steps: 20 });
  await page.waitForTimeout(1000);
  
  console.log("Simülasyon tamamlandı. Video kaydedildi.");
  await context.close();
  await browser.close();
})();