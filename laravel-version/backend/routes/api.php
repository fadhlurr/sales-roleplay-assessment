<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ScenarioController;
use App\Http\Controllers\Api\SessionController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('app.jwtauth')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('role:admin,hr');

    Route::get('/scenarios', [ScenarioController::class, 'index']);
    Route::get('/scenarios/{id}', [ScenarioController::class, 'show']);
    Route::post('/scenarios', [ScenarioController::class, 'store'])->middleware('role:admin');

    Route::get('/sessions', [SessionController::class, 'index']);
    Route::post('/sessions', [SessionController::class, 'store']);
    Route::get('/sessions/{id}', [SessionController::class, 'show']);
    Route::post('/sessions/{id}/messages', [SessionController::class, 'sendMessage']);
    Route::post('/sessions/{id}/complete', [SessionController::class, 'complete']);

    Route::get('/dashboard/hr', [DashboardController::class, 'hr'])->middleware('role:hr,admin');
    Route::get('/dashboard/hr/candidates/{userId}', [DashboardController::class, 'candidateDetail'])->middleware('role:hr,admin');
    Route::get('/dashboard/hr/compare', [DashboardController::class, 'compare'])->middleware('role:hr,admin');
    Route::get('/dashboard/manager', [DashboardController::class, 'manager'])->middleware('role:manager,admin');
    Route::get('/dashboard/manager/users/{userId}', [DashboardController::class, 'salesDetail'])->middleware('role:manager,admin');
    Route::get('/dashboard/audit-logs', [DashboardController::class, 'auditLogs'])->middleware('role:admin,manager,hr');
});
