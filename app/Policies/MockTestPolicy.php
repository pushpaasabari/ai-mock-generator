<?php

namespace App\Policies;

use App\Models\MockTest;
use App\Models\User;

class MockTestPolicy
{
    public function view(User $user, MockTest $mockTest): bool
    {
        return true; // Everyone can take tests
    }

    public function delete(User $user, MockTest $mockTest): bool
    {
        return $user->id === $mockTest->user_id || $user->is_admin;
    }
}
