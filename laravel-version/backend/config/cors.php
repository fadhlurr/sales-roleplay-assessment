<?php

return [

    'paths' => ['api/*', 'health', 'up'],

    'allowed_methods' => ['*'],

    // Replika cors({origin: allowedOrigins}) di app.js Express: daftar origin
    // dari env var CORS_ORIGIN (dipisah koma, di-trim, entri kosong dibuang).
    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('CORS_ORIGIN', 'http://localhost:5175'))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Frontend cuma kirim header Authorization Bearer, tidak pernah cookie.
    'supports_credentials' => false,

];
