<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

// Port 1:1 dari helper usersWithSessions/summarizeUser/categoryAverages di
// dashboardController.js (dipakai bersama oleh dashboard HR dan Manager).
class DashboardSummaryService
{
    public static function usersWithSessions(string $role): array
    {
        $users = User::where('role', $role)
            ->with(['roleplaySessions.scenario', 'roleplaySessions.assessment'])
            ->orderBy('name')
            ->get();

        return $users->map(fn (User $u) => self::summarizeUser($u))->all();
    }

    public static function summarizeUser(User $user): array
    {
        $sessions = $user->roleplaySessions;
        $completed = $sessions->filter(fn ($s) => $s->status === 'completed' && $s->assessment);

        $overallScores = $completed->map(fn ($s) => $s->assessment->overall_score);
        $avg = $overallScores->isNotEmpty() ? (int) round($overallScores->avg()) : null;

        $latest = $completed->isNotEmpty()
            ? $completed->sortByDesc('completed_at')->first()
            : null;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'totalSessions' => $sessions->count(),
            'completedSessions' => $completed->count(),
            'averageScore' => $avg,
            'latestScore' => $latest ? $latest->assessment->overall_score : null,
            'status' => $completed->count() === 0 ? 'belum_assessment' : 'sudah_assessment',
            'sessions' => $sessions->map(fn ($s) => [
                'id' => $s->id,
                'scenario' => $s->scenario?->name,
                'scenarioType' => $s->scenario?->type,
                'status' => $s->status,
                'startedAt' => $s->started_at,
                'completedAt' => $s->completed_at,
                'overallScore' => $s->assessment?->overall_score,
                'communicationScore' => $s->assessment?->communication_score,
                'pitchScore' => $s->assessment?->pitch_score,
                'objectionScore' => $s->assessment?->objection_score,
                'confidenceScore' => $s->assessment?->confidence_score,
                'closingScore' => $s->assessment?->closing_score,
            ])->values()->all(),
        ];
    }

    private const CATEGORY_FIELDS = [
        ['key' => 'communication', 'field' => 'communicationScore', 'label' => 'Komunikasi'],
        ['key' => 'pitch', 'field' => 'pitchScore', 'label' => 'Pitch'],
        ['key' => 'objection', 'field' => 'objectionScore', 'label' => 'Objection Handling'],
        ['key' => 'confidence', 'field' => 'confidenceScore', 'label' => 'Kepercayaan Diri'],
        ['key' => 'closing', 'field' => 'closingScore', 'label' => 'Closing'],
    ];

    public static function categoryAverages(array $salesUsers): array
    {
        $sessions = collect($salesUsers)
            ->flatMap(fn ($u) => $u['sessions'])
            ->filter(fn ($s) => $s['overallScore'] !== null);

        $averages = collect(self::CATEGORY_FIELDS)->map(function ($c) use ($sessions) {
            $values = $sessions->pluck($c['field'])->filter(fn ($v) => $v !== null);
            $avg = $values->isNotEmpty() ? (int) round($values->avg()) : null;

            return ['key' => $c['key'], 'label' => $c['label'], 'average' => $avg];
        });

        $withScores = $averages->filter(fn ($a) => $a['average'] !== null);
        $weakest = $withScores->isNotEmpty()
            ? $withScores->sortBy('average')->first()['key']
            : null;

        return ['averages' => $averages->values()->all(), 'weakest' => $weakest];
    }
}
