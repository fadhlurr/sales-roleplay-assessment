<?php

namespace Database\Seeders;

use App\Models\Assessment;
use App\Models\Message;
use App\Models\RoleplaySession;
use App\Models\Scenario;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

// Port 1:1 dari express-version/backend/src/seed.js — teks skenario, akun
// demo, dan data seed session/transcript/assessment harus sama persis supaya
// akun demo & tampilan berperilaku identik dengan versi Express.
class DatabaseSeeder extends Seeder
{
    private const SCENARIOS = [
        [
            'name' => 'Cold Call — Perkenalan Produk',
            'type' => 'cold_call',
            'description' => 'Menelepon calon pelanggan yang belum pernah dihubungi sebelumnya untuk memperkenalkan produk.',
            'instruction' => 'Kamu adalah manajer operasional yang sedang sibuk dan belum kenal produk ini sama sekali. Jawab telepon dengan sedikit waspada, beri kesempatan sales menjelaskan tujuan telepon.',
        ],
        [
            'name' => 'Product Pitch — Presentasi ke Calon Klien',
            'type' => 'product_pitch',
            'description' => 'Melakukan presentasi produk kepada calon klien yang sudah menjadwalkan meeting.',
            'instruction' => 'Kamu adalah calon klien yang cukup tertarik tapi ingin memahami value produk secara konkret sebelum lanjut. Ajukan pertanyaan seputar manfaat dan perbedaan dengan solusi yang sudah kamu pakai.',
        ],
        [
            'name' => 'Objection Handling — Keberatan Harga',
            'type' => 'objection_handling',
            'description' => 'Menghadapi calon pelanggan yang keberatan dengan harga dan membandingkan dengan kompetitor.',
            'instruction' => 'Kamu adalah calon pelanggan yang merasa harga produk ini terlalu mahal dibanding kompetitor. Ajukan objection terkait harga dan value, baru melunak jika sales memberi alasan yang masuk akal.',
        ],
        [
            'name' => 'Closing Conversation — Menutup Kesepakatan',
            'type' => 'closing',
            'description' => 'Percakapan tahap akhir untuk mendorong calon pelanggan mengambil keputusan.',
            'instruction' => 'Kamu adalah calon pelanggan yang sudah tertarik tapi masih ragu-ragu mengambil keputusan final. Beri alasan penundaan yang realistis, baru setuju jika sales melakukan closing yang meyakinkan.',
        ],
    ];

    private const USERS = [
        ['name' => 'Admin Sistem', 'email' => 'admin@roleplay.test', 'role' => 'admin'],
        ['name' => 'Rina HR', 'email' => 'hr@roleplay.test', 'role' => 'hr'],
        ['name' => 'Budi Manager', 'email' => 'manager@roleplay.test', 'role' => 'manager'],
        ['name' => 'Sari Sales', 'email' => 'sales@roleplay.test', 'role' => 'sales'],
        ['name' => 'Dimas Candidate', 'email' => 'candidate@roleplay.test', 'role' => 'candidate'],
        ['name' => 'Wulan Candidate', 'email' => 'candidate2@roleplay.test', 'role' => 'candidate'],
    ];

    private const DEFAULT_PASSWORD = 'password123';

    public function run(): void
    {
        // Satu hash dipakai ulang untuk semua user, replika persis seed.js
        // (bcrypt.hash dipanggil sekali, disebar ke bulkCreate).
        $passwordHash = Hash::make(self::DEFAULT_PASSWORD);

        $users = collect(self::USERS)->mapWithKeys(function ($u) use ($passwordHash) {
            $user = User::create([...$u, 'password_hash' => $passwordHash]);

            return [$u['email'] => $user];
        });

        $scenarios = collect(self::SCENARIOS)->map(fn ($s) => Scenario::create($s))->values();

        $candidate = $users['candidate@roleplay.test'];
        $scenario = $scenarios[2]; // Objection Handling — Keberatan Harga

        $session = RoleplaySession::create([
            'user_id' => $candidate->id,
            'scenario_id' => $scenario->id,
            'session_type' => 'screening',
            'status' => 'completed',
            'started_at' => now()->subMinutes(30),
            'completed_at' => now(),
        ]);

        $transcriptSeed = [
            ['sender_type' => 'ai', 'message' => 'Sebenarnya kami sudah pakai vendor lain, dan harga Anda kedengarannya lebih mahal.'],
            ['sender_type' => 'user', 'message' => 'Saya paham kekhawatiran soal harga. Boleh saya tahu apa yang paling penting buat Anda dari vendor saat ini?'],
            ['sender_type' => 'ai', 'message' => 'Yang penting sih support-nya cepat, tapi harganya juga jadi pertimbangan besar.'],
            ['sender_type' => 'user', 'message' => 'Kami menawarkan SLA respons di bawah 1 jam dan biaya implementasi gratis di tiga bulan pertama, jadi total cost bisa lebih rendah dari yang Anda bayangkan.'],
        ];

        foreach ($transcriptSeed as $i => $m) {
            Message::create([...$m, 'session_id' => $session->id, 'sequence' => $i + 1]);
        }

        Assessment::create([
            'session_id' => $session->id,
            'communication_score' => 85,
            'pitch_score' => 80,
            'objection_score' => 78,
            'confidence_score' => 84,
            'closing_score' => 75,
            'overall_score' => 80,
            'feedback' => "- Komunikasi sudah cukup jelas.\n- Product value dapat disampaikan dengan baik.\n- Perlu meningkatkan respons terhadap objection.\n- Closing dapat dibuat lebih direct.",
            'summary' => 'Kandidat merespons objection harga dengan cukup baik menggunakan data SLA dan penawaran biaya, namun closing masih belum tegas.',
        ]);

        $this->command->info('Seed selesai. Akun demo (password sama untuk semua): '.self::DEFAULT_PASSWORD);
        foreach (self::USERS as $u) {
            $this->command->info('  '.str_pad($u['role'], 10).' -> '.$u['email']);
        }
    }
}
