<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ScenarioResource;
use App\Models\Scenario;
use Illuminate\Http\Request;

class ScenarioController extends Controller
{
    public function index()
    {
        $scenarios = Scenario::where('status', 'active')->orderBy('id')->get();

        return ScenarioResource::collection($scenarios);
    }

    public function show(string $id)
    {
        $scenario = Scenario::find($id);

        if (! $scenario) {
            return response()->json(['error' => 'Scenario tidak ditemukan'], 404);
        }

        return new ScenarioResource($scenario);
    }

    // admin only (dibatasi oleh middleware role:admin di routes/api.php)
    public function store(Request $request)
    {
        $name = $request->input('name');
        $description = $request->input('description');
        $type = $request->input('type');
        $instruction = $request->input('instruction');

        if (! $name || ! $description || ! $type || ! $instruction) {
            return response()->json(['error' => 'name, description, type, dan instruction wajib diisi'], 400);
        }

        $scenario = Scenario::create([
            'name' => $name,
            'description' => $description,
            'type' => $type,
            'instruction' => $instruction,
        ]);

        return (new ScenarioResource($scenario))->response()->setStatusCode(201);
    }
}
