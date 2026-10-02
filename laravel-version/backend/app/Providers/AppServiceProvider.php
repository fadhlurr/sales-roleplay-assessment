<?php

namespace App\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Backend Express tidak pernah bungkus response dalam {data: ...} —
        // matikan wrapping default Laravel supaya kontrak JSON match persis
        // (frontend React baca field langsung dari root response).
        JsonResource::withoutWrapping();
    }
}
