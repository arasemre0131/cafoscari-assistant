// Background service worker
let claudeTabId = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Ca Foscari Assistant yüklendi!');
  
  chrome.storage.local.set({
    user: 'Emre Aras',
    studentId: '907842'
  });
});

// Claude mesaj handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'askClaude') {
    handleClaudeRequest(request.message).then(sendResponse);
    return true; // async response
  }
});

async function handleClaudeRequest(message) {
  try {
    // Claude sekmesi yoksa aç
    if (!claudeTabId) {
      const tab = await chrome.tabs.create({ url: 'https://claude.ai/new', active: false });
      claudeTabId = tab.id;
      await new Promise(resolve => setTimeout(resolve, 3000)); // Sayfa yüklenmesini bekle
    }
    
    // Claude'a mesaj gönder
    const response = await chrome.tabs.sendMessage(claudeTabId, {
      action: 'sendMessage',
      message: message
    });
    
    return response;
  } catch (error) {
    console.error('Claude error:', error);
    
    // Fallback: Prompt oluştur ve kopyala
    const courses = await chrome.storage.local.get(['courses']);
    const prompt = createPrompt(message, courses.courses || []);
    
    await navigator.clipboard.writeText(prompt);
    
    // Claude'u aç
    chrome.tabs.create({ url: 'https://claude.ai/new' });
    
    return {
      answer: 'Prompt kopyalandı! Claude sekmesine yapıştır (Cmd+V) ve gönder.'
    };
  }
}

function createPrompt(message, courses) {
  return `
Merhaba Claude! Ben Emre Aras, Ca' Foscari Üniversitesi Bilgisayar Bilimleri öğrencisiyim.

Derslerim:
${courses.map(c => `- ${c.fullname}`).join('\n')}

Sorum/İsteğim:
${message}

Lütfen detaylı ve öğretici bir cevap ver. İngilizce terimleri kullan ama Türkçe açıkla.
`;
}

// Periyodik kontroller
setInterval(() => {
  checkMoodleUpdates();
  checkEmails();
}, 30 * 60 * 1000);

async function checkMoodleUpdates() {
  const { moodleToken } = await chrome.storage.local.get(['moodleToken']);
  if (!moodleToken) return;
  
  try {
    const response = await fetch(`https://moodle.unive.it/webservice/rest/server.php?wstoken=${moodleToken}&wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&userid=907842`);
    const courses = await response.json();
    
    chrome.storage.local.set({ 
      courses: courses,
      lastMoodleSync: new Date().toISOString()
    });
  } catch (error) {
    console.error('Moodle sync error:', error);
  }
}

async function checkEmails() {
  // Gmail kontrolü
  console.log('Gmail kontrol ediliyor...');
}
