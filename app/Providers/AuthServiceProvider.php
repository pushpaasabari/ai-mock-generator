<?php

namespace App\Providers;

use App\Models\Attempt;
use App\Models\Document;
use App\Models\MockTest;
use App\Policies\AttemptPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\MockTestPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     */
    protected $policies = [
        Document::class => DocumentPolicy::class,
        MockTest::class => MockTestPolicy::class,
        Attempt::class => AttemptPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
