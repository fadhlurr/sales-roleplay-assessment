<?php

namespace App\Services;

use App\Exceptions\AiServiceException;
use App\Models\Scenario;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

// Port 1:1 dari services/aiService.js, termasuk mode mock-nya (dipakai kalau
// OPENAI_API_KEY belum diset, supaya bisa demo tanpa API key / tanpa biaya).
class AiService
{
    public static function isMockMode(): bool
    {
        return empty(config('services.openai.key'));
    }

    private const SCENARIO_OPENERS = [
        'cold_call' => 'Halo, ini siapa ya? Saya lagi sibuk, ada perlu apa?',
        'product_pitch' => 'Oke, saya dengar tim Anda mau presentasi produk. Silakan, saya beri waktu 10 menit.',
        'objection_handling' => 'Sebenarnya kami sudah pakai vendor lain, dan harga Anda kedengarannya lebih mahal.',
        'closing' => 'Saya masih mempertimbangkan beberapa opsi lain sebelum memutuskan.',
    ];

    private const SCENARIO_OBJECTIONS = [
        'Harganya kok lebih mahal dari kompetitor ya?',
        'Saya belum yakin ini benar-benar kami butuhkan sekarang.',
        'Tim saya pernah kecewa dengan vendor sejenis sebelumnya.',
        'Butuh waktu untuk diskusi dulu dengan atasan saya.',
    ];

    private static function buildSystemPrompt(Scenario $scenario): string
    {
        return implode("\n", [
            'Kamu berperan sebagai calon pelanggan (customer/prospect) dalam simulasi latihan sales.',
            "Skenario: {$scenario->name} (tipe: {$scenario->type}).",
            "Instruksi skenario: {$scenario->instruction}",
            'Aturan peran:',
            '- Tetap berperan sebagai customer/prospect sepanjang percakapan, jangan pernah keluar dari karakter.',
            '- Balasan singkat dan natural, 1-4 kalimat gaya percakapan lisan sehari-hari.',
            '- Sesekali berikan objection atau pertanyaan yang relevan dengan tipe skenario.',
            '- Jangan menilai performa sales di dalam percakapan ini — itu dilakukan sistem terpisah setelah sesi selesai.',
            '- Jika ini pesan pembuka simulasi (belum ada respons dari sales), mulai percakapan sesuai karakter skenario.',
        ]);
    }

    private static function mockCustomerReply(Scenario $scenario, Collection $history): string
    {
        if ($history->isEmpty()) {
            return self::SCENARIO_OPENERS[$scenario->type] ?? 'Halo, silakan mulai.';
        }

        $aiCount = $history->where('sender_type', 'ai')->count();
        $idx = $aiCount % count(self::SCENARIO_OBJECTIONS);

        return '[MOCK AI — set OPENAI_API_KEY untuk respons asli] '.self::SCENARIO_OBJECTIONS[$idx];
    }

    public static function generateCustomerReply(Scenario $scenario, Collection $history): string
    {
        if (self::isMockMode()) {
            return self::mockCustomerReply($scenario, $history);
        }

        $messages = [['role' => 'system', 'content' => self::buildSystemPrompt($scenario)]];

        if ($history->isEmpty()) {
            $messages[] = ['role' => 'user', 'content' => '(Simulasi dimulai. Buka percakapan sesuai karaktermu.)'];
        } else {
            foreach ($history as $m) {
                $messages[] = [
                    'role' => $m->sender_type === 'ai' ? 'assistant' : 'user',
                    'content' => $m->message,
                ];
            }
        }

        try {
            $response = Http::withToken(config('services.openai.key'))
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model'),
                    'messages' => $messages,
                ]);

            if ($response->failed()) {
                throw new AiServiceException('Gagal menghubungi AI API: '.$response->body());
            }

            $text = trim((string) data_get($response->json(), 'choices.0.message.content'));

            if ($text === '') {
                throw new AiServiceException('AI tidak mengembalikan respons teks');
            }

            return $text;
        } catch (AiServiceException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new AiServiceException('Gagal menghubungi AI API: '.$e->getMessage());
        }
    }

    private const ASSESSMENT_FUNCTION = [
        'name' => 'submit_assessment',
        'description' => 'Kirim hasil penilaian performa sales berdasarkan transcript role-play.',
        'parameters' => [
            'type' => 'object',
            'properties' => [
                'communicationScore' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                'pitchScore' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                'objectionScore' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                'confidenceScore' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                'closingScore' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                'overallScore' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                'feedback' => [
                    'type' => 'string',
                    'description' => 'Feedback dalam beberapa poin singkat (pisahkan dengan baris baru), membahas kekuatan dan area perbaikan.',
                ],
                'summary' => ['type' => 'string', 'description' => 'Ringkasan singkat 2-3 kalimat tentang jalannya percakapan.'],
            ],
            'required' => [
                'communicationScore', 'pitchScore', 'objectionScore', 'confidenceScore',
                'closingScore', 'overallScore', 'feedback', 'summary',
            ],
            'additionalProperties' => false,
        ],
    ];

    private static function mockAssessment(Collection $transcript): array
    {
        $userTurns = $transcript->where('sender_type', 'user')->count();
        $base = min(60 + $userTurns * 3, 88);

        return [
            'communicationScore' => $base,
            'pitchScore' => $base - 2,
            'objectionScore' => $base - 5,
            'confidenceScore' => $base + 2,
            'closingScore' => $base - 4,
            'overallScore' => $base - 1,
            'feedback' => implode("\n", [
                '[MOCK AI — set OPENAI_API_KEY untuk penilaian asli]',
                '- Komunikasi cukup jelas sepanjang percakapan.',
                '- Perlu lebih tegas saat merespons objection.',
                '- Closing dapat dibuat lebih direct.',
            ]),
            'summary' => 'Ringkasan otomatis (mode mock): percakapan berjalan dengan beberapa pertukaran objection dan pertanyaan produk.',
        ];
    }

    public static function generateAssessment(Scenario $scenario, Collection $transcript): array
    {
        if (self::isMockMode()) {
            return self::mockAssessment($transcript);
        }

        $transcriptText = $transcript
            ->map(fn ($m) => ($m->sender_type === 'user' ? 'SALES' : 'CUSTOMER').": {$m->message}")
            ->implode("\n");

        $system = implode("\n", [
            "Kamu adalah evaluator performa sales. Nilai transcript role-play berikut berdasarkan skenario \"{$scenario->name}\" ({$scenario->type}).",
            'Kriteria penilaian (skor 0-100 per aspek):',
            '1. Communication Clarity — kejelasan komunikasi.',
            '2. Product/Service Value Delivery (pitchScore) — kemampuan menyampaikan nilai produk.',
            '3. Objection Handling (objectionScore) — kemampuan menjawab keberatan.',
            '4. Confidence — rasa percaya diri dalam merespons.',
            '5. Closing Ability (closingScore) — kemampuan mengarahkan ke closing.',
            'Beri overallScore sebagai rata-rata tertimbang wajar dari kelima aspek. Gunakan function submit_assessment untuk mengirim hasil.',
        ]);

        try {
            $response = Http::withToken(config('services.openai.key'))
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model'),
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user', 'content' => "Transcript:\n{$transcriptText}"],
                    ],
                    'tools' => [['type' => 'function', 'function' => self::ASSESSMENT_FUNCTION]],
                    'tool_choice' => ['type' => 'function', 'function' => ['name' => 'submit_assessment']],
                ]);

            if ($response->failed()) {
                throw new AiServiceException('Gagal menghubungi AI API untuk assessment: '.$response->body());
            }

            $args = data_get($response->json(), 'choices.0.message.tool_calls.0.function.arguments');

            if (! $args) {
                throw new AiServiceException('AI tidak mengembalikan hasil assessment');
            }

            return json_decode($args, true);
        } catch (AiServiceException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new AiServiceException('Gagal menghubungi AI API untuk assessment: '.$e->getMessage());
        }
    }
}
