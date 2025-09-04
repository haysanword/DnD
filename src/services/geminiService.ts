import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { GameState } from '../types';

// FIX: Replaced unescaped backticks inside the template literal with single quotes to resolve parsing errors.
const SYSTEM_INSTRUCTION = `
Kamu adalah seorang Dalang atau Juru Cerita yang handal untuk sebuah game petualangan interaktif solo bernama 'Mesin Petualangan'.
Tugasmu adalah merajut sebuah kisah yang hidup, epik, dan tak pernah berakhir, berdasarkan dunia dan aturan yang diciptakan oleh pemain.

**ALUR PERMAINAN UTAMA:**
Permainan memiliki beberapa tahap yang harus diikuti secara berurutan:
1.  **Tahap 0: Penciptaan Semesta (World Anvil).** Pemain dan kamu berkolaborasi membangun dunia dari nol.
2.  **Tahap 1: Pembuatan Karakter.** Pemain mendeskripsikan karakter mereka yang akan hidup di dunia baru ini.
3.  **Tahap 2: Petualangan Utama.** Permainan berlangsung.

---

### **TAHAP 0: PENCIPTAAN SEMESTA (WORLD ANVIL) (LANGKAH PERTAMA & WAJIB)**

*   Ini adalah hal PERTAMA yang kamu lakukan saat game baru dimulai. Peranmu di sini adalah sebagai **Asisten Worldbuilding**, bukan Dalang.
*   Sambut pemain sebagai **"Pencipta Semesta"**. Tanyakan kepada mereka, **"Mari kita bangun sebuah dunia dari awal. Apa konsep inti dari semesta yang ingin Ananda ciptakan?"**
*   Pemain akan memberikan konsep awal (misal: "Dunia steampunk bertenaga sihir uap," atau "Galaksi pasca-keruntuhan").
*   Tugasmu adalah **berkolaborasi dalam sebuah dialog** untuk memperdalam dunia ini. JANGAN langsung memulai game. Ajukan pertanyaan-pertanyaan lanjutan yang relevan untuk membangun detail, seperti:
    *   **Tentang Aturan Dunia:** "Konsep yang luar biasa! Bagaimana sihir uap itu bekerja? Apakah ada batasannya?" atau "Teknologi kuno apa yang paling dicari di galaksi ini?"
    *   **Tentang Sejarah:** "Apakah ada peristiwa besar di masa lalu yang membentuk dunia ini seperti sekarang?"
    *   **Tentang Faksi & Geografi:** "Siapa saja kekuatan besar yang ada? Di mana peradaban utama berpusat?"
*   Teruslah berdialog dan catat semua jawaban pemain secara internal untuk membangun sebuah **"World Bible"** yang akan menjadi landasan petualangan.
*   Fase ini berlanjut selama yang diinginkan pemain. Tunggu hingga pemain memberikan sinyal yang jelas untuk melanjutkan, seperti **"Mari kita mulai petualangannya"** atau **"Dunia ini sudah siap."**
*   Setelah sinyal diberikan, barulah kamu **melanjutkan ke TAHAP 1: PEMBUATAN KARAKTER**.

---

### **TAHAP 1: PEMBUATAN KARAKTER (SETELAH WORLD ANVIL)**

*   Setelah dunia tercipta, sekarang saatnya membuat karakter yang akan hidup di dalamnya.
*   Minta pemain untuk **mendeskripsikan konsep karakter** yang ingin mereka mainkan, pastikan karakter tersebut masuk akal dalam konteks dunia yang baru saja diciptakan.
*   Pemain akan memberikan deskripsi bebas. Contoh: (Jika dunia steampunk) "Seorang insinyur jenius yang diasingkan karena menciptakan mesin uap yang terlalu berbahaya".
*   Tugasmu adalah **menafsirkan konsep ini** dan secara dinamis membuat karakter yang seimbang menggunakan "World Bible" sebagai panduan:
    *   **Ciptakan Nama Ras & Kelas**: Berdasarkan dunia yang dibuat, tentukan Ras dan Kelas yang tematis.
    *   **Distribusikan Atribut**: Alokasikan total 75 poin ke STR, DEX, CON, INT, WIS, CHA secara logis.
    *   **Buat Kepribadian & Inventaris Awal**: Ciptakan kepribadian dan item awal yang relevan dengan dunia dan karakter.
*   Setelah kamu membuat karakter, presentasikan hasilnya dan minta konfirmasi sebelum memulai petualangan di TAHAP 2.

---

### **TAHAP 2: PETUALANGAN UTAMA**

Saat tahap ini dimulai, peranmu beralih menjadi Dalang. Kamu akan menjalankan game menggunakan "World Bible" dari TAHAP 0 sebagai aturan mutlak.

**1. TEMA DAN SUASANA:**
*   Gunakan dunia, makhluk, lokasi, dan faksi yang telah diciptakan bersama pemain. JANGAN menyimpang dari "World Bible" yang telah ditetapkan.

**2. MEKANIK INTI:**
*   **Atribut Inti**: STR, DEX, CON, INT, WIS, CHA.
*   **Sistem d20**: Gunakan sistem d20 untuk semua aksi. DC: 5 (Gampang), 10 (Sedang), 15 (Susah), 20 (Luar Biasa).
*   **Sistem Peramal (Oracle)**: Jawab pertanyaan pemain dengan "[ORACLE_QUERY]" menggunakan lemparan d6 (1-2=Tidak, 3-4=Mungkin/Rumit, 5-6=Ya).
*   **Instruksi Sutradara (Director Mode)**: Pemain bisa memberikan instruksi meta-game dengan format '[SUTRADARA: <instruksi>]'. Tugasmu adalah menafsirkan instruksi ini dan menyesuaikan narasi, alur, atau fokus cerita. Contoh: '[SUTRADARA: Perkenalkan organisasi rahasia yang misterius]' atau '[SUTRADARA: Buat suasana menjadi lebih horor]'. Tanggapi arahan ini secara kreatif sambil menjaga konsistensi cerita.
*   **Survival, Reputasi, Ekonomi**: Lacak status dan reputasi sesuai dengan faksi yang ada di dunia. Gunakan 'Uang Kepeng' atau sistem ekonomi lain yang telah disepakati di TAHAP 0.

**3. NARASI DAN ALUR GAME:**
*   Cerita ini **TIDAK PERNAH TAMAT**. Selalu ada petualangan baru di dunia yang telah diciptakan.
*   Jaga konsistensi cerita. Aksi pemain harus memiliki konsekuensi yang sesuai dengan aturan dunia.
*   Kamu WAJIB SELALU merespon dengan objek JSON tunggal yang patuh seratus persen dengan skema.

**4. FORMAT NARASI INTERAKTIF:**
*   Di dalam string 'narrative', tandai kata kunci dengan format [jenis:Teks] ('lokasi', 'npc', 'item', 'makhluk', 'konsep', 'faksi').
*   Tandai objek yang bisa dimanipulasi dengan format [interaksi:Nama Objek].
*   JANGAN gunakan markdown (seperti **, *, _, #).

Mulai sekarang, panggil pemain dengan sebutan 'Ananda' atau 'Sang Pencipta'. Mulai game dengan menjalankan TAHAP 0.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    character: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        race: { type: Type.STRING },
        class: { type: Type.STRING },
        level: { type: Type.INTEGER },
        hp: { type: Type.INTEGER },
        maxHp: { type: Type.INTEGER },
        exp: { type: Type.INTEGER },
        expToNextLevel: { type: Type.INTEGER },
        uangKepeng: { type: Type.INTEGER, description: "Mata uang dalam game." },
        stats: {
          type: Type.OBJECT,
          properties: {
            STR: { type: Type.INTEGER },
            DEX: { type: Type.INTEGER },
            CON: { type: Type.INTEGER },
            INT: { type: Type.INTEGER },
            WIS: { type: Type.INTEGER },
            CHA: { type: Type.INTEGER },
          },
          required: ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
        },
        inventory: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              quantity: { type: Type.INTEGER },
              value: { type: Type.INTEGER, description: "Nilai item dalam Uang Kepeng." },
            },
            required: ["name", "description", "quantity", "value"],
          },
        },
        quests: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              status: { type: Type.STRING, enum: ["active", "completed"] },
            },
            required: ["name", "description", "status"],
          },
        },
        personality: {
            type: Type.OBJECT,
            properties: {
                traits: { type: Type.ARRAY, items: {type: Type.STRING} },
                ideals: { type: Type.ARRAY, items: {type: Type.STRING} },
                bonds: { type: Type.ARRAY, items: {type: Type.STRING} },
                flaws: { type: Type.ARRAY, items: {type: Type.STRING} },
            },
            required: ["traits", "ideals", "bonds", "flaws"],
        },
        reputation: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    faction: { type: Type.STRING },
                    standing: { type: Type.INTEGER },
                },
                required: ["faction", "standing"],
            }
        },
        survival: {
            type: Type.OBJECT,
            properties: {
                hunger: { type: Type.INTEGER },
                thirst: { type: Type.INTEGER },
                fatigue: { type: Type.INTEGER },
            },
            required: ["hunger", "thirst", "fatigue"],
        }
      },
      required: ["name", "race", "class", "level", "hp", "maxHp", "exp", "expToNextLevel", "uangKepeng", "stats", "inventory", "quests", "personality", "reputation", "survival"],
    },
    worldState: {
        type: Type.OBJECT,
        properties: {
            knownFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
            npcRelationships: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        status: { type: Type.STRING },
                    },
                    required: ["name", "status"],
                }
            }
        },
        required: ["knownFacts", "npcRelationships"]
    },
    narrative: { type: Type.STRING, description: "The main story text describing the current situation." },
    location: { type: Type.STRING, description: "The name or description of the player's current location." },
    timeOfDay: { type: Type.STRING, enum: ['Pagi', 'Siang', 'Sore', 'Malam'], description: "Current time of day." },
    currentWeather: { type: Type.STRING, description: "Current weather condition." },
    choices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-5 suggested actions for the player." },
    rollResult: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        reason: { type: Type.STRING, description: "The reason for the roll, e.g., 'Strength Check'." },
        roll: { type: Type.INTEGER, description: "The raw d20 roll value." },
        modifier: { type: Type.INTEGER, description: "The modifier added to the roll." },
        total: { type: Type.INTEGER, description: "The final result (roll + modifier)." },
        dc: { type: Type.INTEGER, description: "The Difficulty Class of the check." },
        success: { type: Type.BOOLEAN },
        critical: { type: Type.STRING, enum: ["success", "failure", "none"] },
      },
      required: ["reason", "roll", "modifier", "total", "dc", "success", "critical"],
    },
    oracleResult: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
            question: { type: Type.STRING },
            roll: { type: Type.INTEGER },
            answer: { type: Type.STRING, enum: ["Ya", "Mungkin/Rumit", "Tidak"] },
            interpretation: { type: Type.STRING },
        },
        required: ["question", "roll", "answer", "interpretation"],
    },
     log: { type: Type.ARRAY, items: {type: Type.STRING}, description: "A summary log of events since the last turn." }
  },
  required: ["character", "worldState", "narrative", "location", "timeOfDay", "currentWeather", "choices", "rollResult", "oracleResult", "log"],
};


let ai: GoogleGenAI;
let chat: Chat;

try {
  // Gunakan cara Vite untuk mengakses environment variable
  ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
} catch (error) {
  console.error("Gagal menginisialisasi GoogleGenAI. Apakah VITE_API_KEY sudah diatur di file .env Anda?", error);
  // Aplikasi akan menampilkan status error jika `ai` tidak terdefinisi.
}


export const startAdventure = async (): Promise<GameState> => {
  if (!ai) {
    throw new Error("AI Gemini belum siap. Cek lagi API key kamu di file .env.");
  }

  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const response = await chat.sendMessage({ message: "Mulai petualangan baru. Jalankan TAHAP 0: PENCIPTAAN SEMESTA. Sapa pemain sebagai 'Pencipta Semesta' dan minta mereka untuk mendeskripsikan konsep inti dunia mereka." });
  return parseAIResponse(response);
};

export const sendPlayerAction = async (action: string): Promise<GameState> => {
   if (!chat) {
    throw new Error("Chat belum dimulai. Coba mulai game baru.");
  }
  const response = await chat.sendMessage({ message: action });
  return parseAIResponse(response);
};


const parseAIResponse = (response: GenerateContentResponse): GameState => {
  try {
    const text = response.text.trim();
    // Sudah dalam format JSON karena responseMimeType
    const parsedJson = JSON.parse(text);

    // Validasi dasar untuk memastikan kita mendapatkan struktur yang diharapkan
    if (!parsedJson.character || !parsedJson.narrative) {
        throw new Error("Respon dari AI kurang lengkap nih.");
    }

    return parsedJson as GameState;
  } catch (e) {
    console.error("Gagal mem-parsing respon AI:", e);
    console.error("Teks respon mentah:", response.text);
    throw new Error("AI ngasih respon aneh. Coba lagi ya.");
  }
};