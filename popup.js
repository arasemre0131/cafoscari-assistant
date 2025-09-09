// Tab değiştirme
function switchTab(tabName) {
  // Tüm tabları gizle
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Seçili tabı göster
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
}

// Claude'a mesaj gönder
async function sendToClaude() {
  const input = document.getElementById('claudeInput');
  const message = input.value.trim();
  if (!message) return;
  
  // Kullanıcı mesajını ekle
  addMessage(message, 'user');
  input.value = '';
  
  // Claude'a gönder
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'askClaude',
      message: message
    });
    
    // Claude cevabını ekle
    addMessage(response.answer || 'Cevap alınamadı', 'assistant');
  } catch (error) {
    addMessage('Hata: ' + error.message, 'assistant');
  }
}

// Mesaj ekle
function addMessage(text, sender) {
  const messagesDiv = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Hızlı prompt
function quickPrompt(type) {
  const prompts = {
    exam: 'Computer Architecture dersi için 10 soruluk mock exam hazırla',
    study: 'Bu hafta için çalışma planı oluştur',
    explain: 'ARM Assembly konusunu basitçe anlat',
    homework: 'Ödevimde yardıma ihtiyacım var'
  };
  
  document.getElementById('claudeInput').value = prompts[type];
  sendToClaude();
}

// Moodle senkronla
async function syncMoodle() {
  const token = await getStoredValue('moodleToken');
  if (!token) {
    alert('Önce Moodle token gir!');
    switchTab('settings');
    return;
  }
  
  try {
    const response = await fetch(`https://moodle.unive.it/webservice/rest/server.php?wstoken=${token}&wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&userid=907842`);
    const courses = await response.json();
    
    chrome.storage.local.set({ courses: courses });
    
    document.getElementById('moodleStatus').className = 'status connected';
    document.getElementById('moodleStatus').textContent = 'Bağlı';
    
    alert(`${courses.length} ders senkronlandı!`);
  } catch (error) {
    alert('Moodle bağlantı hatası!');
  }
}

// Gmail kontrol
function checkEmails() {
  chrome.tabs.create({ url: 'https://mail.google.com/mail/u/0/#search/from%3A%40unive.it' });
}

// Mock Exam oluştur
async function generateMockExam() {
  const courses = await getStoredValue('courses') || [];
  
  if (courses.length === 0) {
    alert('Önce Moodle\'dan dersleri senkronla!');
    return;
  }
  
  const courseList = courses.map(c => c.fullname).join('\n');
  const selectedCourse = prompt(`Hangi ders için mock exam?\n\n${courseList}`);
  
  if (!selectedCourse) return;
  
  const message = `${selectedCourse} dersi için 20 soruluk mock exam hazırla. 15 çoktan seçmeli, 5 kısa cevap. İngilizce terimler kullan ama Türkçe açıkla.`;
  
  document.getElementById('claudeInput').value = message;
  switchTab('claude');
  sendToClaude();
}

// Çalışma planı
async function createStudyPlan() {
  const courses = await getStoredValue('courses') || [];
  const message = `Derslerim: ${courses.map(c => c.fullname).join(', ')}. Bu hafta için detaylı çalışma planı oluştur.`;
  
  document.getElementById('claudeInput').value = message;
  switchTab('claude');
  sendToClaude();
}

// Deadline kontrolü
function checkDeadlines() {
  const message = 'Yaklaşan ödev ve sınav tarihlerimi kontrol et ve öncelik sırasına göre listele.';
  document.getElementById('claudeInput').value = message;
  switchTab('claude');
  sendToClaude();
}

// Ayarları kaydet
function saveSettings() {
  const settings = {
    moodleToken: document.getElementById('moodleToken').value,
    gmailApiKey: document.getElementById('gmailApiKey').value,
    studentId: document.getElementById('studentId').value,
    univePassword: document.getElementById('univePassword').value
  };
  
  chrome.storage.local.set(settings, () => {
    alert('Ayarlar kaydedildi!');
    
    // Durumları güncelle
    if (settings.moodleToken) {
      document.getElementById('moodleStatus').className = 'status connected';
      document.getElementById('moodleStatus').textContent = 'Token var';
    }
    
    if (settings.gmailApiKey) {
      document.getElementById('gmailStatus').className = 'status connected';
      document.getElementById('gmailStatus').textContent = 'API key var';
    }
  });
}

// Claude'a bağlan
function connectClaude() {
  chrome.tabs.create({ url: 'https://claude.ai' }, (tab) => {
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { action: 'setupClaude' });
    }, 2000);
  });
}

// Storage'dan değer al
function getStoredValue(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

// URL aç
function openMoodle() {
  chrome.tabs.create({ url: 'https://moodle.unive.it' });
}

function openGmail() {
  chrome.tabs.create({ url: 'https://mail.google.com' });
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
  // Kayıtlı ayarları yükle
  const settings = await chrome.storage.local.get(['moodleToken', 'gmailApiKey', 'studentId']);
  
  if (settings.moodleToken) {
    document.getElementById('moodleToken').value = settings.moodleToken;
    document.getElementById('moodleStatus').className = 'status connected';
    document.getElementById('moodleStatus').textContent = 'Token var';
  }
  
  if (settings.gmailApiKey) {
    document.getElementById('gmailApiKey').value = settings.gmailApiKey;
    document.getElementById('gmailStatus').className = 'status connected';
    document.getElementById('gmailStatus').textContent = 'API key var';
  }
  
  if (settings.studentId) {
    document.getElementById('studentId').value = settings.studentId;
  }
});
