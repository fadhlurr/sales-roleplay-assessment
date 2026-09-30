require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Scenario, RoleplaySession, Message, Assessment } = require('./models');

const SCENARIOS = [
  {
    name: 'Cold Call — Perkenalan Produk',
    type: 'cold_call',
    description: 'Menelepon calon pelanggan yang belum pernah dihubungi sebelumnya untuk memperkenalkan produk.',
    instruction: 'Kamu adalah manajer operasional yang sedang sibuk dan belum kenal produk ini sama sekali. Jawab telepon dengan sedikit waspada, beri kesempatan sales menjelaskan tujuan telepon.',
  },
  {
    name: 'Product Pitch — Presentasi ke Calon Klien',
    type: 'product_pitch',
    description: 'Melakukan presentasi produk kepada calon klien yang sudah menjadwalkan meeting.',
    instruction: 'Kamu adalah calon klien yang cukup tertarik tapi ingin memahami value produk secara konkret sebelum lanjut. Ajukan pertanyaan seputar manfaat dan perbedaan dengan solusi yang sudah kamu pakai.',
  },
  {
    name: 'Objection Handling — Keberatan Harga',
    type: 'objection_handling',
    description: 'Menghadapi calon pelanggan yang keberatan dengan harga dan membandingkan dengan kompetitor.',
    instruction: 'Kamu adalah calon pelanggan yang merasa harga produk ini terlalu mahal dibanding kompetitor. Ajukan objection terkait harga dan value, baru melunak jika sales memberi alasan yang masuk akal.',
  },
  {
    name: 'Closing Conversation — Menutup Kesepakatan',
    type: 'closing',
    description: 'Percakapan tahap akhir untuk mendorong calon pelanggan mengambil keputusan.',
    instruction: 'Kamu adalah calon pelanggan yang sudah tertarik tapi masih ragu-ragu mengambil keputusan final. Beri alasan penundaan yang realistis, baru setuju jika sales melakukan closing yang meyakinkan.',
  },
];

const USERS = [
  { name: 'Admin Sistem', email: 'admin@roleplay.test', role: 'admin' },
  { name: 'Rina HR', email: 'hr@roleplay.test', role: 'hr' },
  { name: 'Budi Manager', email: 'manager@roleplay.test', role: 'manager' },
  { name: 'Sari Sales', email: 'sales@roleplay.test', role: 'sales' },
  { name: 'Dimas Candidate', email: 'candidate@roleplay.test', role: 'candidate' },
  { name: 'Wulan Candidate', email: 'candidate2@roleplay.test', role: 'candidate' },
];

const DEFAULT_PASSWORD = 'password123';

async function seed() {
  await sequelize.sync({ force: true });

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const users = await User.bulkCreate(USERS.map((u) => ({ ...u, passwordHash })));
  const scenarios = await Scenario.bulkCreate(SCENARIOS);

  const candidate = users.find((u) => u.email === 'candidate@roleplay.test');
  const scenario = scenarios[2];

  const session = await RoleplaySession.create({
    userId: candidate.id,
    scenarioId: scenario.id,
    sessionType: 'screening',
    status: 'completed',
    startedAt: new Date(Date.now() - 1000 * 60 * 30),
    completedAt: new Date(),
  });

  const transcriptSeed = [
    { senderType: 'ai', message: 'Sebenarnya kami sudah pakai vendor lain, dan harga Anda kedengarannya lebih mahal.' },
    { senderType: 'user', message: 'Saya paham kekhawatiran soal harga. Boleh saya tahu apa yang paling penting buat Anda dari vendor saat ini?' },
    { senderType: 'ai', message: 'Yang penting sih support-nya cepat, tapi harganya juga jadi pertimbangan besar.' },
    { senderType: 'user', message: 'Kami menawarkan SLA respons di bawah 1 jam dan biaya implementasi gratis di tiga bulan pertama, jadi total cost bisa lebih rendah dari yang Anda bayangkan.' },
  ];
  await Message.bulkCreate(transcriptSeed.map((m, i) => ({ ...m, sessionId: session.id, sequence: i + 1 })));

  await Assessment.create({
    sessionId: session.id,
    communicationScore: 85,
    pitchScore: 80,
    objectionScore: 78,
    confidenceScore: 84,
    closingScore: 75,
    overallScore: 80,
    feedback: '- Komunikasi sudah cukup jelas.\n- Product value dapat disampaikan dengan baik.\n- Perlu meningkatkan respons terhadap objection.\n- Closing dapat dibuat lebih direct.',
    summary: 'Kandidat merespons objection harga dengan cukup baik menggunakan data SLA dan penawaran biaya, namun closing masih belum tegas.',
  });

  console.log('Seed selesai. Akun demo (password sama untuk semua):', DEFAULT_PASSWORD);
  USERS.forEach((u) => console.log(`  ${u.role.padEnd(10)} -> ${u.email}`));
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed gagal:', err);
  process.exit(1);
});
