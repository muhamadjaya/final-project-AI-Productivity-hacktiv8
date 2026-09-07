import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Primary model and fallback
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files from ../client
app.use(express.static(path.join(__dirname, '../client')));

// Persona System Instruction Generator
function generateSystemInstruction(persona, goal, experienceLevel, userProfile) {
  const personaPrompt = `Kamu adalah 'Coach FitVibe', Smart Gym & Nutrition Coach generasi Gen-Z yang cerdas, asik, berbobot, dan ramah.
Karakter, Pengetahuan, dan Gaya Bahasamu:
1. Ramah, santai tapi berbobot (Gen-Z friendly vibes), suportif, dan realistis tanpa ribet. Gunakan bahasa Indonesia modern yang natural, sopan, dan memotivasi (boleh gunakan sapaan santai seperti "kamu", "bro/sis", atau panggil nama pengguna jika tersedia).
2. Memadukan ilmu sains olahraga terverifikasi (evidence-based biomechanics, progressive overload terukur, dan perhitungan makronutrisi) dengan gaya hidup modern yang fleksibel dan anti-overthinking.
3. Menjelaskan teknik form gerakan dengan presisi untuk mencegah cedera, menyusun jadwal latihan yang efisien (split latihan cerdas di gym maupun di rumah), serta memberikan edukasi meal plan sehat dan ramah kantong.
4. Format jawaban dengan rapi menggunakan Markdown (tabel untuk jadwal/menu makan, bullet points untuk tips, dan penekanan bold untuk poin kunci).`;

  let goalPrompt = '';
  switch (goal) {
    case 'fat_loss':
      goalPrompt = `FOKUS TARGET: Fat Loss & Definisi Otot (Cutting).
Prioritaskan strategi defisit kalori moderat, asupan protein tinggi untuk menjaga massa otot (1.8-2.2g/kg BB), latihan beban resistensi untuk stimulasi otot, dan kardio efisien (LISS / HIIT).`;
      break;
    case 'hypertrophy':
      goalPrompt = `FOKUS TARGET: Pembentukan Otot & Hipertrofi (Bulking / Muscle Building).
Prioritaskan progressive overload, volume latihan optimal (10-20 set per kelompok otot per minggu), surplus kalori bersih (+300-400 kcal), dan recovery yang cukup.`;
      break;
    case 'strength':
      goalPrompt = `FOKUS TARGET: Kekuatan Maksimal & Powerlifting (Strength).
Prioritaskan gerakan compound utama (Squat, Bench Press, Deadlift, Overhead Press), intensitas tinggi (RPE 8-9.5, rentang 3-6 repetisi), istirahat antardisk 3-5 menit, dan kesiapan sistem saraf pusat (CNS).`;
      break;
    case 'productivity':
    default:
      goalPrompt = `FOKUS TARGET: Produktivitas, Kebugaran Cepat & Work-Life Balance.
Prioritaskan rutinitas latihan efisien waktu (30-45 menit, seperti full body split atau calisthenics di rumah), perbaikan postur tubuh pekerja kantoran/duduk lama, mobilitas sendi, dan peningkatan energi harian.`;
      break;
  }

  const levelPrompt = `TINGKAT PENGALAMAN PENGGUNA: ${
    experienceLevel === 'beginner'
      ? 'Pemula (Prioritaskan keamanan sendi, teknik form dasar yang benar, adaptasi neuromuskular, dan jangan berikan beban ekstrem).'
      : experienceLevel === 'advanced'
      ? 'Mahir (Bisa bahas variasi teknik intensif seperti drop set, myo-reps, periodisasi gelombang, dan pemecahan plateau).'
      : 'Menengah (Fokus pada variasi split seperti PPL atau Upper/Lower, progressive overload terukur, dan optimasi nutrisi).'
  }`;

  let profilePrompt = 'MEMORI PROFIL PENGGUNA:\n';
  if (userProfile && typeof userProfile === 'object') {
    if (userProfile.name) profilePrompt += `- Nama: ${userProfile.name}\n`;
    if (userProfile.gender) profilePrompt += `- Jenis Kelamin: ${userProfile.gender}\n`;
    if (userProfile.age) profilePrompt += `- Usia: ${userProfile.age} tahun\n`;
    if (userProfile.weightKg) profilePrompt += `- Berat Badan: ${userProfile.weightKg} kg\n`;
    if (userProfile.heightCm) profilePrompt += `- Tinggi Badan: ${userProfile.heightCm} cm\n`;
    if (userProfile.dietary) profilePrompt += `- Preferensi Makanan/Diet: ${userProfile.dietary}\n`;
    if (userProfile.workoutDays) profilePrompt += `- Rencana Latihan: ${userProfile.workoutDays} hari per minggu\n`;
  } else {
    profilePrompt += '- Belum ada data spesifik; tanyakan dengan sopan jika diperlukan untuk perhitungan kalori/latihan yang akurat.\n';
  }

  const outputGuidelines = `PANDUAN FORMAT RESPON:
1. Format output menggunakan Markdown yang rapi (gunakan bolding, bullet point, dan tabel sederhana jika menyajikan jadwal latihan atau meal plan).
2. Selalu tekankan pentingnya pemanasan (warm-up), hidrasi, form yang benar, dan istirahat.
3. Selalu konsisten dengan persona yang dipilih dari sapaan hingga penutup.
4. Di bagian akhir setiap jawaban, sertakan 2-3 rekomendasi pertanyaan lanjutan singkat (suggested follow-up) yang bisa ditanyakan pengguna, diawali dengan tag:
[SUGGESTIONS: Pertanyaan 1 | Pertanyaan 2 | Pertanyaan 3]`;

  return `${personaPrompt}

${goalPrompt}

${levelPrompt}

${profilePrompt}

${outputGuidelines}`;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'FitVibe AI Chatbot',
    version: '1.0.0',
    primaryModel: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
    timestamp: new Date().toISOString()
  });
});

// Scientific BMR, TDEE and Macro Calculator endpoint
app.post('/api/calculate-macros', (req, res) => {
  try {
    const { gender = 'male', age = 25, weightKg = 70, heightCm = 175, activity = 'moderate', goal = 'fat_loss' } = req.body;

    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    const a = parseFloat(age);

    if (isNaN(w) || isNaN(h) || isNaN(a) || w <= 0 || h <= 0 || a <= 0) {
      return res.status(400).json({ error: 'Data berat, tinggi, atau usia tidak valid.' });
    }

    // Mifflin-St Jeor Equation
    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (gender === 'female') {
      bmr -= 161;
    } else {
      bmr += 5;
    }
    bmr = Math.round(bmr);

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,       // Sedikit atau tanpa olahraga
      light: 1.375,         // Latihan 1-3 hari/minggu
      moderate: 1.55,       // Latihan 3-5 hari/minggu
      active: 1.725,        // Latihan 6-7 hari/minggu
      very_active: 1.9      // Latihan fisik berat 2x sehari / atlet
    };

    const multiplier = activityMultipliers[activity] || 1.55;
    const tdee = Math.round(bmr * multiplier);

    // Goal adjustment
    let targetCalories = tdee;
    if (goal === 'fat_loss') {
      targetCalories = Math.round(tdee - 450); // Defisit sehat
    } else if (goal === 'hypertrophy') {
      targetCalories = Math.round(tdee + 350); // Surplus bersih
    } else if (goal === 'strength') {
      targetCalories = Math.round(tdee + 150); // Slight surplus/maintenance
    }

    // Protein: 2.0g per kg bodyweight
    const proteinGrams = Math.round(w * 2.0);
    const proteinCalories = proteinGrams * 4;

    // Fat: 25% of target calories
    const fatCalories = Math.round(targetCalories * 0.25);
    const fatGrams = Math.round(fatCalories / 9);

    // Carbs: Remainder of calories
    const carbCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
    const carbGrams = Math.round(carbCalories / 4);

    return res.json({
      success: true,
      stats: {
        weightKg: w,
        heightCm: h,
        age: a,
        gender,
        activity,
        goal
      },
      results: {
        bmr,
        tdee,
        targetCalories,
        macros: {
          protein: { grams: proteinGrams, calories: proteinCalories, percent: Math.round((proteinCalories / targetCalories) * 100) },
          carbs: { grams: carbGrams, calories: carbCalories, percent: Math.round((carbCalories / targetCalories) * 100) },
          fats: { grams: fatGrams, calories: fatCalories, percent: Math.round((fatCalories / targetCalories) * 100) }
        }
      }
    });
  } catch (error) {
    console.error('Error calculating macros:', error);
    res.status(500).json({ error: 'Gagal menghitung makronutrisi.' });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      persona = 'beast_mode',
      goal = 'hypertrophy',
      experienceLevel = 'intermediate',
      temperature = 0.7,
      userProfile = {}
    } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    const systemInstruction = generateSystemInstruction(persona, goal, experienceLevel, userProfile);

    // Format conversation history for Gemini API
    const formattedContents = [];

    // Append previous turns from history (keep last 10 turns to stay focused and fast)
    const recentHistory = history.slice(-10);
    for (const turn of recentHistory) {
      if (turn.role && turn.text) {
        formattedContents.push({
          role: turn.role === 'bot' ? 'model' : 'user',
          parts: [{ text: turn.text }]
        });
      }
    }

    // Append current user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    // Clamp temperature between 0.0 and 1.2
    const clampedTemp = Math.min(Math.max(parseFloat(temperature) || 0.7, 0.0), 1.2);

    let geminiResponse;
    let modelUsed = PRIMARY_MODEL;

    try {
      geminiResponse = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: clampedTemp
        }
      });
    } catch (primaryErr) {
      console.warn(`Primary model ${PRIMARY_MODEL} failed: ${primaryErr.message}. Trying fallback ${FALLBACK_MODEL}...`);
      modelUsed = FALLBACK_MODEL;
      geminiResponse = await ai.models.generateContent({
        model: FALLBACK_MODEL,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: clampedTemp
        }
      });
    }

    let fullText = geminiResponse.text || 'Maaf, saya tidak dapat memproses jawaban saat ini.';

    // Extract suggestions if generated by the model
    let suggestions = [];
    const suggestionMatch = fullText.match(/\[SUGGESTIONS:\s*(.*?)\]/is);
    if (suggestionMatch) {
      const rawSuggestions = suggestionMatch[1];
      suggestions = rawSuggestions
        .split('|')
        .map(s => s.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter(s => s.length > 0 && s.length < 80)
        .slice(0, 3);
      // Remove the tag from the main output text
      fullText = fullText.replace(suggestionMatch[0], '').trim();
    }

    // Default suggestions if none were parsed
    if (suggestions.length === 0) {
      if (goal === 'fat_loss') {
        suggestions = [
          'Berapa target defisit kalori harian saya?',
          'Rekomendasi latihan kardio yang membakar lemak cepat',
          'Contoh meal plan tinggi protein untuk cutting'
        ];
      } else if (goal === 'strength') {
        suggestions = [
          'Bagaimana cara menaikkan beban Squat dan Deadlift?',
          'Berapa menit jeda istirahat ideal per set?',
          'Penjelasan konsep RPE dan RIR dalam powerlifting'
        ];
      } else {
        suggestions = [
          'Buatkan jadwal latihan Push-Pull-Legs 4 hari',
          'Rekomendasi makanan pre-workout penambah tenaga',
          'Cara mengatasi pegal otot (DOMS) setelah latihan'
        ];
      }
    }

    return res.json({
      success: true,
      reply: fullText,
      suggestions,
      metadata: {
        model: modelUsed,
        persona,
        goal,
        experienceLevel,
        temperature: clampedTemp
      }
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({
      error: 'Terjadi kesalahan saat memproses pesan melalui Gemini API: ' + (error.message || 'Unknown error')
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FitVibe AI Server running at http://localhost:${PORT}`);
});