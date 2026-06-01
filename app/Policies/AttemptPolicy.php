<?php

namespace App\Policies;

use App\Models\Attempt;
use App\Models\User;

class AttemptPolicy
{
    public function view(User $user, Attempt $attempt): bool
    {
        return $user->id === $attempt->user_id || $user->is_admin;
    }

    public function update(User $user, Attempt $attempt): bool
    {
        return $user->id === $attempt->user_id;
    }
}
