/**
 * FitVibe AI - Client Application Script
 * Gen-Z Smart Gym, Nutrition & Productivity Coach
 */

// ==========================================================================
// STATE MANAGEMENT & CONFIG
// ==========================================================================

const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : 'http://localhost:3000/api';

const PERSONA_CONFIGS = {
  fitvibe_coach: {
    name: 'Coach FitVibe',
    initials: 'FV',
    avatar: 'FV',
    badge: 'Gen-Z Strength & Nutrition Coach',
    hint: 'Official Gen-Z Coach',
    modeDesc: 'Certified Smart Gym & Macro Coach',
    welcome: 'Halo! Saya Coach FitVibe, pelatih gym & nutrisi cerdas generasi Gen-Z. Siap membantumu menyusun workout split efisien, hitung makronutrisi harian fleksibel, dan jaga progres konsisten tanpa overthinking. Apa target atau pertanyaanmu hari ini?'
  },
  fithub_coach: {
    name: 'Coach FitVibe',
    initials: 'FV',
    avatar: 'FV',
    badge: 'Gen-Z Strength & Nutrition Coach',
    hint: 'Official Gen-Z Coach',
    modeDesc: 'Certified Smart Gym & Macro Coach',
    welcome: 'Halo! Saya Coach FitVibe, pelatih gym & nutrisi cerdas generasi Gen-Z. Siap membantumu menyusun workout split efisien, hitung makronutrisi harian fleksibel, dan jaga progres konsisten tanpa overthinking. Apa target atau pertanyaanmu hari ini?'
  }
};

const GOAL_LABELS = {
  hypertrophy: 'Hipertrofi',
  fat_loss: 'Fat Loss',
  strength: 'Strength',
  productivity: '30m Efisien'
};

const LEVEL_LABELS = {
  beginner: 'Pemula',
  intermediate: 'Menengah',
  advanced: 'Mahir'
};

let appState = {
  persona: 'fitvibe_coach',
  goal: 'hypertrophy',
  experienceLevel: 'intermediate',
  temperature: 0.7,
  userProfile: {
    name: '',
    gender: 'male',
    weightKg: 70,
    heightCm: 175,
    age: 25,
    workoutDays: 4,
    dietary: ''
  },
  history: [],
  ttsEnabled: false,
  isRecording: false,
  isGenerating: false
};

// ==========================================================================
// DOM ELEMENTS
// ==========================================================================

const sidebar = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const navSidebarOpenBtn = document.getElementById('nav-sidebar-open-btn');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');

const personaCards = document.querySelectorAll('.persona-card');
const goalSelect = document.getElementById('goal-select');
const experienceBtns = document.querySelectorAll('#experience-selector .pill-btn');
// Profile Memory Inputs
const profName = document.getElementById('prof-name');
const profGender = document.getElementById('prof-gender');
const profWeight = document.getElementById('prof-weight');
const profHeight = document.getElementById('prof-height');
const profAge = document.getElementById('prof-age');
const profDays = document.getElementById('prof-days');
const profDiet = document.getElementById('prof-diet');
const saveProfileBtn = document.getElementById('save-profile-btn');

// Top Nav Elements
const navCoachAvatar = document.getElementById('nav-coach-avatar');
const navCoachName = document.getElementById('nav-coach-name');
const navCoachMode = document.getElementById('nav-coach-mode');
const activePersonaHint = document.getElementById('active-persona-hint');
const ttsToggleBtn = document.getElementById('tts-toggle-btn');
const ttsIcon = document.getElementById('tts-icon');
const exportChatBtn = document.getElementById('export-chat-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');

// Status Pill Bar
const pillPersona = document.getElementById('pill-persona');
const pillGoal = document.getElementById('pill-goal');
const pillLevel = document.getElementById('pill-level');
const pillUser = document.getElementById('pill-user');

// Chat Elements
const chatBox = document.getElementById('chat-box');
const welcomeHero = document.getElementById('welcome-hero');
const heroWelcomeText = document.getElementById('hero-welcome-text');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const voiceStatus = document.getElementById('voice-status');

// Suggestions Bar
const suggestionsBar = document.getElementById('suggestions-bar');
const suggestionsList = document.getElementById('suggestions-list');

// Calculator Widget Button
const calcMacrosBtn = document.getElementById('calc-macros-btn');
const toastEl = document.getElementById('toast');

// Speech Recognition instance
let recognition = null;

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadSavedState();
  initSpeechRecognition();
  bindEvents();
  updateUIFromState();
  checkServerHealth();
  initSidebarState();
});

function loadSavedState() {
  try {
    const savedProfile = localStorage.getItem('fitpulse_profile');
    if (savedProfile) {
      appState.userProfile = { ...appState.userProfile, ...JSON.parse(savedProfile) };
    }

    const savedSettings = localStorage.getItem('fitpulse_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.persona && PERSONA_CONFIGS[parsed.persona]) {
        appState.persona = parsed.persona === 'fithub_coach' ? 'fitvibe_coach' : parsed.persona;
      } else {
        appState.persona = 'fitvibe_coach';
      }
      if (parsed.goal) appState.goal = parsed.goal;
      if (parsed.experienceLevel) appState.experienceLevel = parsed.experienceLevel;
      appState.temperature = 0.7; // Standardized optimal default
      if (parsed.ttsEnabled !== undefined) appState.ttsEnabled = parsed.ttsEnabled;
    }
  } catch (e) {
    console.warn('Gagal membaca state dari localStorage:', e);
  }
}

function saveProfileToStorage() {
  appState.userProfile = {
    name: profName.value.trim(),
    gender: profGender.value,
    weightKg: parseFloat(profWeight.value) || 70,
    heightCm: parseFloat(profHeight.value) || 175,
    age: parseInt(profAge.value, 10) || 25,
    workoutDays: parseInt(profDays.value, 10) || 4,
    dietary: profDiet.value.trim()
  };

  localStorage.setItem('fitpulse_profile', JSON.stringify(appState.userProfile));
  saveSettingsToStorage();
  updateStatusPills();
  showToast('✅ Memori profil berhasil disimpan!');
}

function saveSettingsToStorage() {
  const settings = {
    persona: appState.persona,
    goal: appState.goal,
    experienceLevel: appState.experienceLevel,
    temperature: appState.temperature,
    ttsEnabled: appState.ttsEnabled
  };
  localStorage.setItem('fitpulse_settings', JSON.stringify(settings));
}

// ==========================================================================
// UI UPDATE FUNCTIONS
// ==========================================================================

function updateUIFromState() {
  // Sync profile form inputs
  if (appState.userProfile.name) profName.value = appState.userProfile.name;
  if (appState.userProfile.gender) profGender.value = appState.userProfile.gender;
  if (appState.userProfile.weightKg) profWeight.value = appState.userProfile.weightKg;
  if (appState.userProfile.heightCm) profHeight.value = appState.userProfile.heightCm;
  if (appState.userProfile.age) profAge.value = appState.userProfile.age;
  if (appState.userProfile.workoutDays) profDays.value = appState.userProfile.workoutDays;
  if (appState.userProfile.dietary) profDiet.value = appState.userProfile.dietary;

  // Persona
  personaCards.forEach(card => {
    if (card.dataset.persona === appState.persona) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  // Goal
  goalSelect.value = appState.goal;

  // Experience level
  experienceBtns.forEach(btn => {
    if (btn.dataset.level === appState.experienceLevel) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Coach header
  const config = PERSONA_CONFIGS[appState.persona] || PERSONA_CONFIGS.fitvibe_coach;
  navCoachAvatar.textContent = config.initials || 'FV';
  navCoachName.textContent = config.name;
  navCoachMode.textContent = `${config.modeDesc} • ${GOAL_LABELS[appState.goal] || 'Fitness'}`;
  activePersonaHint.textContent = config.hint;
  heroWelcomeText.textContent = config.welcome;

  // TTS status
  if (appState.ttsEnabled) {
    ttsToggleBtn.classList.add('active');
  } else {
    ttsToggleBtn.classList.remove('active');
  }

  updateStatusPills();
}

function updateStatusPills() {
  const config = PERSONA_CONFIGS[appState.persona] || PERSONA_CONFIGS.fithub_coach;
  pillPersona.textContent = `${config.name}`;
  pillGoal.textContent = GOAL_LABELS[appState.goal] || appState.goal;
  pillLevel.textContent = LEVEL_LABELS[appState.experienceLevel] || appState.experienceLevel;

  const userName = appState.userProfile.name;
  if (userName) {
    pillUser.textContent = `${userName} (${appState.userProfile.weightKg}kg / ${appState.userProfile.heightCm}cm)`;
  } else {
    pillUser.textContent = 'Belum diisi';
  }
}

// ==========================================================================
// EVENT BINDINGS
// ==========================================================================
// SIDEBAR TOGGLE & RESPONSIVE BEHAVIOR
// ==========================================================================

function isMobileView() {
  return window.innerWidth <= 900;
}

function initSidebarState() {
  if (!isMobileView() && localStorage.getItem('fitvibe_sidebar_collapsed') === 'true') {
    sidebar.classList.add('collapsed');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.title = 'Tampilkan Sidebar (Ctrl+B)';
    }
  }
}

function toggleSidebar() {
  if (isMobileView()) {
    const willOpen = !sidebar.classList.contains('open');
    if (willOpen) {
      sidebar.classList.add('open');
      if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
    } else {
      sidebar.classList.remove('open');
      if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    }
  } else {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.title = isCollapsed ? 'Tampilkan Sidebar (Ctrl+B)' : 'Sembunyikan Sidebar (Ctrl+B)';
    }
    localStorage.setItem('fitvibe_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  }
}

function closeSidebar() {
  if (isMobileView()) {
    sidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  } else {
    sidebar.classList.add('collapsed');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.title = 'Tampilkan Sidebar (Ctrl+B)';
    }
    localStorage.setItem('fitvibe_sidebar_collapsed', 'true');
  }
}

function bindEvents() {
  // Sidebar toggles (Sidebar-header toggle & Navbar open toggle)
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', toggleSidebar);
  }

  if (navSidebarOpenBtn) {
    navSidebarOpenBtn.addEventListener('click', toggleSidebar);
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle, Escape to close
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      toggleSidebar();
    } else if (e.key === 'Escape') {
      closeSidebar();
    }
  });

  // Handle window resize between mobile and desktop
  window.addEventListener('resize', () => {
    if (!isMobileView()) {
      sidebar.classList.remove('open');
      if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    }
  });

  // Persona cards click
  personaCards.forEach(card => {
    card.addEventListener('click', () => {
      appState.persona = card.dataset.persona;
      personaCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      saveSettingsToStorage();
      updateUIFromState();
      showToast(`Persona diubah ke ${PERSONA_CONFIGS[appState.persona].name}`);
    });
  });

  // Goal select change
  goalSelect.addEventListener('change', (e) => {
    appState.goal = e.target.value;
    saveSettingsToStorage();
    updateUIFromState();
    showToast(`Target diubah ke ${GOAL_LABELS[appState.goal]}`);
  });

  // Experience level click
  experienceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      appState.experienceLevel = btn.dataset.level;
      experienceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveSettingsToStorage();
      updateUIFromState();
      showToast(`Level pengalaman diubah ke ${LEVEL_LABELS[appState.experienceLevel]}`);
    });
  });

  // Save profile memory button
  saveProfileBtn.addEventListener('click', saveProfileToStorage);

  // Quick Macro Calculator button
  calcMacrosBtn.addEventListener('click', handleQuickMacroCalculation);

  // TTS Toggle button
  ttsToggleBtn.addEventListener('click', () => {
    appState.ttsEnabled = !appState.ttsEnabled;
    if (!appState.ttsEnabled) {
      window.speechSynthesis.cancel();
    }
    updateUIFromState();
    saveSettingsToStorage();
    showToast(`Voice audio ${appState.ttsEnabled ? 'diaktifkan' : 'dinonaktifkan'}`);
  });

  // Clear / Reset chat button
  clearChatBtn.addEventListener('click', handleResetChat);

  // Export chat button
  exportChatBtn.addEventListener('click', handleExportChat);

  // Quick Prompt Chips
  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.dataset.prompt;
      if (promptText) {
        userInput.value = promptText;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  });

  // Auto-resize textarea & Enter key to submit
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = `${Math.min(userInput.scrollHeight, 140)}px`;
  });

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // Form submit handler
  chatForm.addEventListener('submit', handleSendMessage);

  // Voice recording button
  if (voiceBtn) {
    voiceBtn.addEventListener('click', toggleVoiceRecognition);
  }
}

// ==========================================================================
// CHAT & API INTERACTION
// ==========================================================================

async function handleSendMessage(e) {
  if (e) e.preventDefault();

  const message = userInput.value.trim();
  if (!message || appState.isGenerating) return;

  // Hide welcome hero on first message
  if (welcomeHero) welcomeHero.style.display = 'none';

  // Append user message
  appendMessage('user', message);
  appState.history.push({ role: 'user', text: message });

  // Clear input
  userInput.value = '';
  userInput.style.height = 'auto';
  suggestionsBar.classList.add('hidden');

  // Show typing indicator
  appState.isGenerating = true;
  sendBtn.disabled = true;
  const typingElement = showTypingIndicator();

  try {
    const payload = {
      message,
      history: appState.history.slice(-10),
      persona: appState.persona,
      goal: appState.goal,
      experienceLevel: appState.experienceLevel,
      temperature: appState.temperature,
      userProfile: appState.userProfile
    };

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    removeTypingIndicator(typingElement);

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Gagal berkomunikasi dengan server.');
    }

    const reply = data.reply || 'Maaf, tidak ada respon.';
    appendMessage('bot', reply);
    appState.history.push({ role: 'bot', text: reply });

    // Voice TTS if enabled
    if (appState.ttsEnabled) {
      speakText(reply);
    }

    // Render follow-up suggestions
    if (data.suggestions && data.suggestions.length > 0) {
      renderSuggestions(data.suggestions);
    }

    // Scroll to bottom after message and suggestions are rendered
    requestAnimationFrame(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
      setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
      }, 80);
    });
  } catch (error) {
    console.error('Chat error:', error);
    removeTypingIndicator(typingElement);
    appendMessage('bot', `⚠️ Maaf, terjadi kendala teknis: ${error.message}. Pastikan server backend sedang berjalan di http://localhost:3000.`);
  } finally {
    appState.isGenerating = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

function appendMessage(sender, rawText) {
  const row = document.createElement('div');
  row.classList.add('message-row', sender);

  const config = PERSONA_CONFIGS[appState.persona] || PERSONA_CONFIGS.fithub_coach;
  const avatarText = sender === 'user' 
    ? (appState.userProfile.name ? appState.userProfile.name.charAt(0).toUpperCase() : 'U') 
    : (config.initials || 'FH');
  const senderName = sender === 'user' ? (appState.userProfile.name || 'Anda') : config.name;

  const formattedHtml = sender === 'bot' ? parseMarkdown(rawText) : escapeHtml(rawText);

  const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  row.innerHTML = `
    <div class="msg-avatar">${avatarText}</div>
    <div class="msg-body">
      <div class="msg-header">
        <span class="msg-sender">${senderName}</span>
        <span class="msg-time">${timestamp}</span>
      </div>
      <div class="msg-bubble">${formattedHtml}</div>
      ${sender === 'bot' ? `
        <div class="msg-actions">
          <button class="action-icon-btn copy-msg-btn" title="Salin Respons">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Salin</span>
          </button>
          <button class="action-icon-btn speak-msg-btn" title="Dengarkan Suara">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <span>Putar Audio</span>
          </button>
        </div>
      ` : ''}
    </div>
  `;

  // Attach listeners to actions
  if (sender === 'bot') {
    const copyBtn = row.querySelector('.copy-msg-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(rawText);
      showToast('Respons disalin ke clipboard');
    });

    const speakBtn = row.querySelector('.speak-msg-btn');
    speakBtn.addEventListener('click', () => {
      speakText(rawText);
    });
  }

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
  const config = PERSONA_CONFIGS[appState.persona] || PERSONA_CONFIGS.fithub_coach;
  const row = document.createElement('div');
  row.classList.add('message-row', 'bot', 'typing-indicator-row');
  row.id = 'active-typing-indicator';

  row.innerHTML = `
    <div class="msg-avatar">${config.initials || 'FH'}</div>
    <div class="typing-bubble">
      <span class="typing-text">${config.name} sedang menyusun respons</span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
  return row;
}

function removeTypingIndicator(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

function renderSuggestions(suggestions) {
  suggestionsList.innerHTML = '';
  suggestions.forEach(item => {
    const chip = document.createElement('button');
    chip.classList.add('suggestion-chip');
    chip.textContent = item;
    chip.addEventListener('click', () => {
      userInput.value = item;
      chatForm.dispatchEvent(new Event('submit'));
    });
    suggestionsList.appendChild(chip);
  });
  suggestionsBar.classList.remove('hidden');
}

// ==========================================================================
// QUICK MACRO CALCULATOR INTEGRATION
// ==========================================================================

async function handleQuickMacroCalculation() {
  saveProfileToStorage();

  const payload = {
    gender: appState.userProfile.gender,
    age: appState.userProfile.age,
    weightKg: appState.userProfile.weightKg,
    heightCm: appState.userProfile.heightCm,
    goal: appState.goal,
    activity: appState.userProfile.workoutDays >= 5 ? 'active' : 'moderate'
  };

  showToast('⏳ Menghitung BMR & Makronutrisi...');

  try {
    const res = await fetch(`${API_BASE_URL}/calculate-macros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menghitung makro');
    }

    const { bmr, tdee, targetCalories, macros } = data.results;

    const calcPrompt = `Tolong buatkan rekomendasi panduan meal plan dan jadwal latihan berdasarkan kalkulasi makronutrisi tubuh saya:
- BMR: ${bmr} kcal
- TDEE: ${tdee} kcal
- Target Kalori Harian: ${targetCalories} kcal
- Protein: ${macros.protein.grams}g (${macros.protein.percent}%)
- Karbohidrat: ${macros.carbs.grams}g (${macros.carbs.percent}%)
- Lemak Sehat: ${macros.fats.grams}g (${macros.fats.percent}%)
- Target: ${GOAL_LABELS[appState.goal]} | Latihan: ${appState.userProfile.workoutDays} hari/minggu
${appState.userProfile.dietary ? `- Preferensi Diet: ${appState.userProfile.dietary}` : ''}

Bagikan contoh menu makan harian dan tips menjalankannya!`;

    // Close sidebar on mobile
    sidebar.classList.remove('open');

    // Put in input and submit
    userInput.value = calcPrompt;
    chatForm.dispatchEvent(new Event('submit'));
  } catch (err) {
    console.error(err);
    showToast(`❌ Gagal menghitung: ${err.message}`);
  }
}

// ==========================================================================
// SPEECH RECOGNITION (STT) & SYNTHESIS (TTS)
// ==========================================================================

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (voiceBtn) {
      voiceBtn.title = 'Speech Recognition tidak didukung di browser ini.';
      voiceBtn.style.opacity = '0.5';
    }
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'id-ID';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    appState.isRecording = true;
    voiceBtn.classList.add('recording');
    voiceStatus.textContent = 'Mendengarkan... Silakan berbicara.';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = (userInput.value ? userInput.value + ' ' : '') + transcript;
    userInput.dispatchEvent(new Event('input'));
    showToast(`🎙️ Terdengar: "${transcript.slice(0, 30)}..."`);
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    voiceStatus.textContent = '';
    showToast(`🎙️ Error mic: ${event.error}`);
  };

  recognition.onend = () => {
    appState.isRecording = false;
    voiceBtn.classList.remove('recording');
    voiceStatus.textContent = '';
  };
}

function toggleVoiceRecognition() {
  if (!recognition) {
    showToast('Fitur input suara tidak didukung browser ini.');
    return;
  }

  if (appState.isRecording) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (e) {
      console.warn('Speech start error:', e);
    }
  }
}

function speakText(text) {
  if (!window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip markdown symbols and suggestions tag for clean speech
  const cleanSpeechText = text
    .replace(/\[SUGGESTIONS:.*?\]/gis, '')
    .replace(/[#*`_~>|]/g, ' ')
    .replace(/\n+/g, '. ')
    .slice(0, 350); // Limit length so speech is not excessively long

  const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
  utterance.lang = 'id-ID';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

// ==========================================================================
// EXPORT & RESET ACTIONS
// ==========================================================================

function handleResetChat() {
  if (appState.history.length === 0) {
    showToast('Chat masih kosong.');
    return;
  }

  if (confirm('Mulai sesi percakapan baru? Riwayat chat saat ini akan dibersihkan.')) {
    appState.history = [];
    chatBox.innerHTML = '';
    if (welcomeHero) {
      welcomeHero.style.display = 'block';
      chatBox.appendChild(welcomeHero);
    }
    suggestionsBar.classList.add('hidden');
    window.speechSynthesis && window.speechSynthesis.cancel();
    showToast('🔄 Percakapan berhasil di-reset!');
  }
}

function handleExportChat() {
  if (appState.history.length === 0) {
    showToast('Belum ada riwayat percakapan untuk diunduh.');
    return;
  }

  const config = PERSONA_CONFIGS[appState.persona] || PERSONA_CONFIGS.beast_mode;
  let doc = `# FitPulse AI - Sesi Rencana Latihan & Kebugaran\n`;
  doc += `Tanggal: ${new Date().toLocaleString('id-ID')}\n`;
  doc += `Pelatih: ${config.name} (${config.badge})\n`;
  doc += `Fokus Target: ${GOAL_LABELS[appState.goal]} | Level: ${LEVEL_LABELS[appState.experienceLevel]}\n`;
  if (appState.userProfile.name) {
    doc += `Profil Pengguna: ${appState.userProfile.name} (BB: ${appState.userProfile.weightKg}kg, TB: ${appState.userProfile.heightCm}cm)\n`;
  }
  doc += `\n---\n\n`;

  appState.history.forEach((turn, idx) => {
    const sender = turn.role === 'user' ? (appState.userProfile.name || 'Pengguna') : config.name;
    doc += `### [${idx + 1}] ${sender}:\n${turn.text}\n\n`;
  });

  const blob = new Blob([doc], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitpulse-session-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 Sesi berhasil diunduh sebagai file .md!');
}

// ==========================================================================
// UTILITIES & MARKDOWN PARSER
// ==========================================================================

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseMarkdown(text) {
  if (!text) return '';

  let html = escapeHtml(text);

  // Parse Markdown Tables
  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (match) => {
    const lines = match.trim().split('\n').map(l => l.trim());
    if (lines.length < 2) return match;

    // Check if second line is table divider like |---|---|
    if (!lines[1].includes('---')) return match;

    const headers = lines[0].split('|').slice(1, -1).map(h => `<th>${h.trim()}</th>`).join('');
    const thead = `<thead><tr>${headers}</tr></thead>`;

    const bodyRows = lines.slice(2).map(row => {
      const cells = row.split('|').slice(1, -1).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const tbody = `<tbody>${bodyRows}</tbody>`;
    return `<table>${thead}${tbody}</table>`;
  });

  // Headers (h3, h2, h1)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Inline Code
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Blockquotes
  html = html.replace(/^>\s?(.*$)/gim, '<blockquote>$1</blockquote>');

  // Bullet Lists
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>(\s*<li>.*<\/li>)*)/gim, '<ul>$1</ul>');

  // Line breaks to paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<table') || trimmed.startsWith('<blockquote')) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('');

  return html;
}

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 3200);
}

async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (res.ok) {
      const data = await res.json();
      console.log('FitPulse Server Health:', data);
    }
  } catch (err) {
    console.warn('Backend server is not yet accessible at', API_BASE_URL);
  }
}
