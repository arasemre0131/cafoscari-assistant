// Claude.ai sayfasında çalışacak script
console.log('Claude integration loaded!');

// Mesaj dinleyici
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendMessage') {
    sendMessageToClaude(request.message).then(sendResponse);
    return true;
  }
  
  if (request.action === 'setupClaude') {
    setupClaude();
  }
});

async function sendMessageToClaude(message) {
  try {
    // Input alanını bul
    const input = document.querySelector('div[contenteditable="true"]') || 
                  document.querySelector('textarea');
    
    if (!input) {
      throw new Error('Claude input alanı bulunamadı');
    }
    
    // Mesajı yaz
    input.focus();
    document.execCommand('selectAll');
    document.execCommand('insertText', false, message);
    
    // Gönder butonunu bul ve tıkla
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const sendButton = document.querySelector('button[aria-label*="Send"]') ||
                      document.querySelector('button:has(svg)');
    
    if (sendButton) {
      sendButton.click();
    }
    
    // Cevabı bekle
    await waitForResponse();
    
    // Cevabı al
    const messages = document.querySelectorAll('[data-testid*="message"]');
    const lastMessage = messages[messages.length - 1];
    
    return {
      answer: lastMessage ? lastMessage.textContent : 'Cevap alınamadı'
    };
  } catch (error) {
    console.error('Claude error:', error);
    return {
      answer: 'Hata: ' + error.message
    };
  }
}

async function waitForResponse() {
  return new Promise((resolve) => {
    let checkInterval = setInterval(() => {
      const thinking = document.querySelector('[data-testid="thinking-indicator"]');
      if (!thinking) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000);
    
    // Max 30 saniye bekle
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 30000);
  });
}

function setupClaude() {
  // Claude'a özel ayarlar
  console.log('Claude setup completed');
  
  // Otomatik context ekle
  const contextMessage = `
Sen benim kişisel ders asistanımsın. 
Ben Emre Aras, Ca' Foscari Üniversitesi Bilgisayar Bilimleri öğrencisiyim.
Öğrenci numaram: 907842

Lütfen tüm cevaplarında:
- İngilizce terimleri kullan ama Türkçe açıkla
- Kod örnekleri ekle
- Adım adım anlat
- Mock exam soruları hazırlarken Ca' Foscari standartlarını kullan
  `;
  
  // İlk mesaj olarak context'i gönder
  sendMessageToClaude(contextMessage);
}
