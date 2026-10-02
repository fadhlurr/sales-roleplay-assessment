<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Nest relasi dengan key PascalCase (Scenario/Assessment/Messages/User) untuk
// kompatibilitas dengan frontend React yang ada, yang ditulis mengikuti gaya
// default Sequelize `include: [...]` di backend Express.
class RoleplaySessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->user_id,
            'scenarioId' => $this->scenario_id,
            'sessionType' => $this->session_type,
            'status' => $this->status,
            'startedAt' => $this->started_at,
            'completedAt' => $this->completed_at,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
            'Scenario' => new ScenarioResource($this->whenLoaded('scenario')),
            'Assessment' => new AssessmentResource($this->whenLoaded('assessment')),
            'Messages' => MessageResource::collection($this->whenLoaded('messages')),
            'User' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
