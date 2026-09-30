const OpenAI = require('openai');

const MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const MOCK_MODE = !process.env.OPENAI_API_KEY;

let client = null;
function getClient() {
  if (!client) client = new OpenAI();
  return client;
}

class AIServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AIServiceError';
  }
}

const SCENARIO_OPENERS = {
  cold_call: 'Halo, ini siapa ya? Saya lagi sibuk, ada perlu apa?',
  product_pitch: 'Oke, saya dengar tim Anda mau presentasi produk. Silakan, saya beri waktu 10 menit.',
  objection_handling: 'Sebenarnya kami sudah pakai vendor lain, dan harga Anda kedengarannya lebih mahal.',
  closing: 'Saya masih mempertimbangkan beberapa opsi lain sebelum memutuskan.',
};

const SCENARIO_OBJECTIONS = [
  'Harganya kok lebih mahal dari kompetitor ya?',
  'Saya belum yakin ini benar-benar kami butuhkan sekarang.',
  'Tim saya pernah kecewa dengan vendor sejenis sebelumnya.',
  'Butuh waktu untuk diskusi dulu dengan atasan saya.',
];

function buildSystemPrompt(scenario) {
  return [
    `Kamu berperan sebagai calon pelanggan (customer/prospect) dalam simulasi latihan sales.`,
    `Skenario: ${scenario.name} (tipe: ${scenario.type}).`,
    `Instruksi skenario: ${scenario.instruction}`,
    `Aturan peran:`,
    `- Tetap berperan sebagai customer/prospect sepanjang percakapan, jangan pernah keluar dari karakter.`,
    `- Balasan singkat dan natural, 1-4 kalimat gaya percakapan lisan sehari-hari.`,
    `- Sesekali berikan objection atau pertanyaan yang relevan dengan tipe skenario.`,
    `- Jangan menilai performa sales di dalam percakapan ini — itu dilakukan sistem terpisah setelah sesi selesai.`,
    `- Jika ini pesan pembuka simulasi (belum ada respons dari sales), mulai percakapan sesuai karakter skenario.`,
  ].join('\n');
}

function mockCustomerReply(scenario, history) {
  if (history.length === 0) return SCENARIO_OPENERS[scenario.type] || 'Halo, silakan mulai.';
  const idx = history.filter((m) => m.senderType === 'ai').length % SCENARIO_OBJECTIONS.length;
  return `[MOCK AI — set OPENAI_API_KEY untuk respons asli] ${SCENARIO_OBJECTIONS[idx]}`;
}

async function generateCustomerReply(scenario, history) {
  if (MOCK_MODE) return mockCustomerReply(scenario, history);

  const messages = [
    { role: 'system', content: buildSystemPrompt(scenario) },
    ...(history.length
      ? history.map((m) => ({ role: m.senderType === 'ai' ? 'assistant' : 'user', content: m.message }))
      : [{ role: 'user', content: '(Simulasi dimulai. Buka percakapan sesuai karaktermu.)' }]),
  ];

  try {
    const response = await getClient().chat.completions.create({ model: MODEL, messages });
    const text = response.choices[0]?.message?.content;
    if (!text) throw new AIServiceError('AI tidak mengembalikan respons teks');
    return text.trim();
  } catch (err) {
    if (err instanceof AIServiceError) throw err;
    throw new AIServiceError(`Gagal menghubungi AI API: ${err.message}`);
  }
}

const ASSESSMENT_FUNCTION = {
  name: 'submit_assessment',
  description: 'Kirim hasil penilaian performa sales berdasarkan transcript role-play.',
  parameters: {
    type: 'object',
    properties: {
      communicationScore: { type: 'integer', minimum: 0, maximum: 100 },
      pitchScore: { type: 'integer', minimum: 0, maximum: 100 },
      objectionScore: { type: 'integer', minimum: 0, maximum: 100 },
      confidenceScore: { type: 'integer', minimum: 0, maximum: 100 },
      closingScore: { type: 'integer', minimum: 0, maximum: 100 },
      overallScore: { type: 'integer', minimum: 0, maximum: 100 },
      feedback: {
        type: 'string',
        description: 'Feedback dalam beberapa poin singkat (pisahkan dengan baris baru), membahas kekuatan dan area perbaikan.',
      },
      summary: { type: 'string', description: 'Ringkasan singkat 2-3 kalimat tentang jalannya percakapan.' },
    },
    required: [
      'communicationScore', 'pitchScore', 'objectionScore', 'confidenceScore',
      'closingScore', 'overallScore', 'feedback', 'summary',
    ],
    additionalProperties: false,
  },
};

function mockAssessment(transcript) {
  const userTurns = transcript.filter((m) => m.senderType === 'user').length;
  const base = Math.min(60 + userTurns * 3, 88);
  return {
    communicationScore: base,
    pitchScore: base - 2,
    objectionScore: base - 5,
    confidenceScore: base + 2,
    closingScore: base - 4,
    overallScore: base - 1,
    feedback: [
      '[MOCK AI — set OPENAI_API_KEY untuk penilaian asli]',
      '- Komunikasi cukup jelas sepanjang percakapan.',
      '- Perlu lebih tegas saat merespons objection.',
      '- Closing dapat dibuat lebih direct.',
    ].join('\n'),
    summary: 'Ringkasan otomatis (mode mock): percakapan berjalan dengan beberapa pertukaran objection dan pertanyaan produk.',
  };
}

async function generateAssessment(scenario, transcript) {
  if (MOCK_MODE) return mockAssessment(transcript);

  const transcriptText = transcript
    .map((m) => `${m.senderType === 'user' ? 'SALES' : 'CUSTOMER'}: ${m.message}`)
    .join('\n');

  const system = [
    `Kamu adalah evaluator performa sales. Nilai transcript role-play berikut berdasarkan skenario "${scenario.name}" (${scenario.type}).`,
    `Kriteria penilaian (skor 0-100 per aspek):`,
    `1. Communication Clarity — kejelasan komunikasi.`,
    `2. Product/Service Value Delivery (pitchScore) — kemampuan menyampaikan nilai produk.`,
    `3. Objection Handling (objectionScore) — kemampuan menjawab keberatan.`,
    `4. Confidence — rasa percaya diri dalam merespons.`,
    `5. Closing Ability (closingScore) — kemampuan mengarahkan ke closing.`,
    `Beri overallScore sebagai rata-rata tertimbang wajar dari kelima aspek. Gunakan function submit_assessment untuk mengirim hasil.`,
  ].join('\n');

  try {
    const response = await getClient().chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Transcript:\n${transcriptText}` },
      ],
      tools: [{ type: 'function', function: ASSESSMENT_FUNCTION }],
      tool_choice: { type: 'function', function: { name: 'submit_assessment' } },
    });
    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new AIServiceError('AI tidak mengembalikan hasil assessment');
    return JSON.parse(toolCall.function.arguments);
  } catch (err) {
    if (err instanceof AIServiceError) throw err;
    throw new AIServiceError(`Gagal menghubungi AI API untuk assessment: ${err.message}`);
  }
}

module.exports = { generateCustomerReply, generateAssessment, AIServiceError, MOCK_MODE };
