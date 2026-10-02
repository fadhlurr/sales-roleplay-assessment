<?php

use App\Http\Middleware\JwtAuthenticate;
use App\Http\Middleware\RequireRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Routing\Exceptions\UrlGenerationException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'app.jwtauth' => JwtAuthenticate::class,
            'role' => RequireRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Semua error di bawah /api/* dibalikin flat {error: "..."} supaya
        // match persis kontrak backend Express (errorHandler.js) — frontend
        // React yang ada baca `data.error`, bukan shape default Laravel
        // {message, errors: {...}}.
        $exceptions->renderable(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($e instanceof NotFoundHttpException || $e instanceof MethodNotAllowedHttpException) {
                return response()->json([
                    'error' => "Route not found: {$request->method()} /{$request->path()}",
                ], 404);
            }

            if ($e instanceof \Illuminate\Validation\ValidationException) {
                $first = collect($e->errors())->flatten()->first();
                return response()->json(['error' => $first ?? 'Validasi gagal'], 422);
            }

            if ($e instanceof UrlGenerationException) {
                return null;
            }

            report($e);

            return response()->json(['error' => 'Terjadi kesalahan pada server'], 500);
        });
    })->create();
