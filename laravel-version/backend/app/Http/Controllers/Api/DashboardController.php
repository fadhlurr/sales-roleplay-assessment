<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\DashboardSummaryService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // GET /api/dashboard/hr?scenarioType=&minScore=&status=
    public function hr(Request $request)
    {
        $candidates = collect(DashboardSummaryService::usersWithSessions('candidate'));

        if ($status = $request->query('status')) {
            $candidates = $candidates->filter(fn ($c) => $c['status'] === $status);
        }

        if ($minScore = $request->query('minScore')) {
            $candidates = $candidates->filter(fn ($c) => ($c['averageScore'] ?? 0) >= (float) $minScore);
        }

        if ($scenarioType = $request->query('scenarioType')) {
            $candidates = $candidates->filter(
                fn ($c) => collect($c['sessions'])->contains(fn ($s) => $s['scenarioType'] === $scenarioType)
            );
        }

        $candidates = $candidates->values();

        return response()->json([
            'totalCandidates' => $candidates->count(),
            'assessedCandidates' => $candidates->filter(fn ($c) => $c['completedSessions'] > 0)->count(),
            'candidates' => $candidates->all(),
        ]);
    }

    // GET /api/dashboard/hr/candidates/:userId
    public function candidateDetail(string $userId)
    {
        $user = User::where('id', $userId)->where('role', 'candidate')
            ->with(['roleplaySessions.scenario', 'roleplaySessions.assessment'])
            ->first();

        if (! $user) {
            return response()->json(['error' => 'Kandidat tidak ditemukan'], 404);
        }

        return response()->json(DashboardSummaryService::summarizeUser($user));
    }

    // GET /api/dashboard/hr/compare?ids=1,2,3
    public function compare(Request $request)
    {
        $ids = collect(explode(',', (string) $request->query('ids', '')))
            ->map(fn ($id) => trim($id))
            ->filter()
            ->values();

        if ($ids->count() < 2) {
            return response()->json(['error' => 'Minimal 2 id kandidat untuk dibandingkan'], 400);
        }

        $users = User::whereIn('id', $ids)->where('role', 'candidate')
            ->with(['roleplaySessions.assessment'])
            ->get();

        $rows = $users->map(function (User $u) {
            $completed = $u->roleplaySessions->filter(fn ($s) => $s->status === 'completed' && $s->assessment);
            $best = $completed->sortByDesc(fn ($s) => $s->assessment->overall_score)->first();

            return [
                'id' => $u->id,
                'name' => $u->name,
                'communication' => $best?->assessment->communication_score,
                'pitch' => $best?->assessment->pitch_score,
                'objection' => $best?->assessment->objection_score,
                'confidence' => $best?->assessment->confidence_score,
                'closing' => $best?->assessment->closing_score,
                'overall' => $best?->assessment->overall_score,
            ];
        });

        return response()->json(['rows' => $rows->values()->all()]);
    }

    // GET /api/dashboard/manager
    public function manager()
    {
        $salesUsers = DashboardSummaryService::usersWithSessions('sales');

        $allScores = collect($salesUsers)
            ->flatMap(fn ($u) => $u['sessions'])
            ->pluck('overallScore')
            ->filter(fn ($v) => $v !== null);

        $avg = $allScores->isNotEmpty() ? (int) round($allScores->avg()) : null;

        ['averages' => $categoryAverages, 'weakest' => $weakest] = DashboardSummaryService::categoryAverages($salesUsers);

        return response()->json([
            'totalSales' => count($salesUsers),
            'totalSessions' => collect($salesUsers)->sum('totalSessions'),
            'averageScore' => $avg,
            'categoryAverages' => $categoryAverages,
            'weakestCategory' => $weakest,
            'salesUsers' => $salesUsers,
        ]);
    }

    // GET /api/dashboard/manager/users/:userId
    public function salesDetail(string $userId)
    {
        $user = User::where('id', $userId)->where('role', 'sales')
            ->with(['roleplaySessions.scenario', 'roleplaySessions.assessment'])
            ->first();

        if (! $user) {
            return response()->json(['error' => 'Sales/trainee tidak ditemukan'], 404);
        }

        return response()->json(DashboardSummaryService::summarizeUser($user));
    }

    // GET /api/dashboard/audit-logs?limit=50
    public function auditLogs(Request $request)
    {
        $limit = min((int) $request->query('limit', 50) ?: 50, 200);

        $logs = AuditLog::with('user:id,name,email,role')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return AuditLogResource::collection($logs);
    }
}
