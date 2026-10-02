<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\AiServiceException;
use App\Http\Controllers\Controller;
use App\Http\Resources\RoleplaySessionResource;
use App\Models\Message;
use App\Models\RoleplaySession;
use App\Models\Scenario;
use App\Services\AiService;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    private function canAccessSession(object $authUser, RoleplaySession $session): bool
    {
        return in_array($authUser->role, ['hr', 'manager', 'admin'], true)
            || $session->user_id === $authUser->userId;
    }

    // GET /api/sessions — riwayat milik user yang sedang login
    public function index(Request $request)
    {
        $authUser = $request->attributes->get('authUser');

        $sessions = RoleplaySession::where('user_id', $authUser->userId)
            ->with('scenario', 'assessment')
            ->orderByDesc('created_at')
            ->get();

        return RoleplaySessionResource::collection($sessions);
    }

    // POST /api/sessions { scenarioId, sessionType }
    // Membuat session baru dan langsung meminta AI membuka percakapan sebagai
    // customer/prospect (AI yang mulai duluan, sesuai alur di PRD).
    public function store(Request $request)
    {
        $authUser = $request->attributes->get('authUser');
        $scenarioId = $request->input('scenarioId');

        if (! $scenarioId) {
            return response()->json(['error' => 'scenarioId wajib diisi'], 400);
        }

        $scenario = Scenario::find($scenarioId);

        if (! $scenario || $scenario->status !== 'active') {
            return response()->json(['error' => 'Scenario tidak ditemukan atau tidak aktif'], 404);
        }

        $session = RoleplaySession::create([
            'user_id' => $authUser->userId,
            'scenario_id' => $scenario->id,
            'session_type' => $request->input('sessionType') === 'screening' ? 'screening' : 'training',
            'status' => 'in_progress',
            'started_at' => now(),
        ]);

        AuditLogger::log($authUser->userId, 'scenario.selected', "Scenario \"{$scenario->name}\" dipilih untuk session #{$session->id}");
        AuditLogger::log($authUser->userId, 'roleplay.started', "Session #{$session->id} dimulai");

        try {
            $opening = AiService::generateCustomerReply($scenario, collect());
        } catch (AiServiceException $e) {
            // Session tetap tersimpan meski AI gagal di awal — tidak kehilangan
            // data, user bisa retry lewat endpoint messages.
            return response()->json([
                'error' => 'AI sedang mengalami gangguan saat membuka simulasi. Coba kirim pesan untuk memulai ulang.',
                'session' => $session,
            ], 502);
        }

        $openingMessage = Message::create([
            'session_id' => $session->id,
            'sender_type' => 'ai',
            'message' => $opening,
            'sequence' => 1,
        ]);

        return response()->json([
            'session' => new RoleplaySessionResource($session),
            'scenario' => new \App\Http\Resources\ScenarioResource($scenario),
            'messages' => \App\Http\Resources\MessageResource::collection(collect([$openingMessage])),
        ], 201);
    }

    // POST /api/sessions/:id/messages { message }
    public function sendMessage(Request $request, string $id)
    {
        $authUser = $request->attributes->get('authUser');
        $session = RoleplaySession::with('scenario')->find($id);

        if (! $session) {
            return response()->json(['error' => 'Session tidak ditemukan'], 404);
        }

        if (! $this->canAccessSession($authUser, $session)) {
            return response()->json(['error' => 'Akses ditolak'], 403);
        }

        if ($session->status !== 'in_progress') {
            return response()->json(['error' => 'Session sudah selesai'], 400);
        }

        $message = trim((string) $request->input('message'));

        if ($message === '') {
            return response()->json(['error' => 'message wajib diisi'], 400);
        }

        $history = Message::where('session_id', $session->id)->orderBy('sequence')->get();
        $nextSeq = $history->count() + 1;

        $userMessage = Message::create([
            'session_id' => $session->id,
            'sender_type' => 'user',
            'message' => $message,
            'sequence' => $nextSeq,
        ]);

        try {
            $reply = AiService::generateCustomerReply($session->scenario, $history->push($userMessage));
        } catch (AiServiceException $e) {
            // Pesan user tetap tersimpan walau AI gagal merespons — memenuhi
            // NFR reliability: error API tidak boleh menghilangkan data session.
            return response()->json([
                'error' => 'AI sedang mengalami gangguan. Pesanmu tersimpan, coba kirim ulang sesaat lagi.',
                'userMessage' => new \App\Http\Resources\MessageResource($userMessage),
            ], 502);
        }

        $aiMessage = Message::create([
            'session_id' => $session->id,
            'sender_type' => 'ai',
            'message' => $reply,
            'sequence' => $nextSeq + 1,
        ]);

        return response()->json([
            'userMessage' => new \App\Http\Resources\MessageResource($userMessage),
            'aiMessage' => new \App\Http\Resources\MessageResource($aiMessage),
        ]);
    }

    // POST /api/sessions/:id/complete
    public function complete(Request $request, string $id)
    {
        $authUser = $request->attributes->get('authUser');
        $session = RoleplaySession::with('scenario')->find($id);

        if (! $session) {
            return response()->json(['error' => 'Session tidak ditemukan'], 404);
        }

        if (! $this->canAccessSession($authUser, $session)) {
            return response()->json(['error' => 'Akses ditolak'], 403);
        }

        if ($session->status === 'completed') {
            $assessment = \App\Models\Assessment::where('session_id', $session->id)->first();

            return response()->json([
                'session' => new RoleplaySessionResource($session),
                'assessment' => $assessment ? new \App\Http\Resources\AssessmentResource($assessment) : null,
            ]);
        }

        $transcript = Message::where('session_id', $session->id)->orderBy('sequence')->get();

        if ($transcript->where('sender_type', 'user')->isEmpty()) {
            return response()->json(['error' => 'Session belum ada respons dari user, belum bisa dinilai'], 400);
        }

        $session->update(['status' => 'completed', 'completed_at' => now()]);
        AuditLogger::log($authUser->userId, 'roleplay.completed', "Session #{$session->id} selesai");

        try {
            $result = AiService::generateAssessment($session->scenario, $transcript);
        } catch (AiServiceException $e) {
            // Session tetap ditandai selesai dan transcript tetap tersimpan;
            // hanya assessment yang belum ada. Frontend bisa menawarkan retry.
            return response()->json([
                'error' => 'AI sedang mengalami gangguan saat membuat penilaian. Transcript sudah tersimpan, coba generate ulang.',
                'session' => new RoleplaySessionResource($session),
            ], 502);
        }

        $assessment = \App\Models\Assessment::create(array_merge(['session_id' => $session->id], [
            'communication_score' => $result['communicationScore'],
            'pitch_score' => $result['pitchScore'],
            'objection_score' => $result['objectionScore'],
            'confidence_score' => $result['confidenceScore'],
            'closing_score' => $result['closingScore'],
            'overall_score' => $result['overallScore'],
            'feedback' => $result['feedback'],
            'summary' => $result['summary'],
        ]));

        AuditLogger::log($authUser->userId, 'assessment.generated', "Assessment untuk session #{$session->id}: overall {$assessment->overall_score}");
        AuditLogger::log($authUser->userId, 'feedback.generated', "Feedback untuk session #{$session->id} dibuat");

        return response()->json([
            'session' => new RoleplaySessionResource($session),
            'assessment' => new \App\Http\Resources\AssessmentResource($assessment),
        ]);
    }

    // GET /api/sessions/:id
    public function show(Request $request, string $id)
    {
        $authUser = $request->attributes->get('authUser');

        $session = RoleplaySession::with([
            'scenario',
            'user:id,name,email,role',
            'assessment',
            'messages' => fn ($q) => $q->orderBy('sequence'),
        ])->find($id);

        if (! $session) {
            return response()->json(['error' => 'Session tidak ditemukan'], 404);
        }

        if (! $this->canAccessSession($authUser, $session)) {
            return response()->json(['error' => 'Akses ditolak'], 403);
        }

        AuditLogger::log($authUser->userId, 'result.viewed', "Session #{$session->id} dilihat oleh {$authUser->email}");

        return new RoleplaySessionResource($session);
    }
}
