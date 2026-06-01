<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create demo admin user
        User::updateOrCreate(
            ['email' => 'admin@tamilmcq.com'],
            [
                'name' => 'Admin User',
                'email' => 'admin@tamilmcq.com',
                'password' => Hash::make('password'),
                'plan' => 'pro',
                'is_admin' => true,
            ]
        );

        // Create demo student user
        User::updateOrCreate(
            ['email' => 'student@tamilmcq.com'],
            [
                'name' => 'Demo Student',
                'email' => 'student@tamilmcq.com',
                'password' => Hash::make('password'),
                'plan' => 'free',
                'is_admin' => false,
            ]
        );

        $this->command->info('✅ Demo users created:');
        $this->command->info('   Admin  → admin@tamilmcq.com / password');
        $this->command->info('   Student → student@tamilmcq.com / password');
    }
}
