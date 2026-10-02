<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssessmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sessionId' => $this->session_id,
            'communicationScore' => $this->communication_score,
            'pitchScore' => $this->pitch_score,
            'objectionScore' => $this->objection_score,
            'confidenceScore' => $this->confidence_score,
            'closingScore' => $this->closing_score,
            'overallScore' => $this->overall_score,
            'feedback' => $this->feedback,
            'summary' => $this->summary,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}
