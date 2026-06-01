<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attempt;
use App\Models\Document;
use App\Models\MockTest;
use App\Models\QuestionBank;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    private function requireAdmin(Request $request)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            abort(403, 'Admin access required');
        }
    }

    // GET /api/admin/stats
    public function stats(Request $request)
    {
        $this->requireAdmin($request);

        return response()->json([
            'stats' => [
                'total_users' => User::count(),
                'pro_users' => User::where('plan', 'pro')->count(),
                'free_users' => User::where('plan', 'free')->count(),
                'total_documents' => Document::count(),
                'total_questions' => QuestionBank::count(),
                'total_tests' => MockTest::count(),
                'total_attempts' => Attempt::count(),
                'completed_attempts' => Attempt::where('status', 'completed')->count(),
            ],
            'recent_users' => User::latest()->take(5)->get(['id', 'name', 'email', 'plan', 'created_at', 'is_admin']),
            'recent_documents' => Document::with('user:id,name,email')
                ->latest()->take(5)
                ->get(['id', 'title', 'subject', 'status', 'total_questions', 'user_id', 'created_at']),
        ]);
    }

    // GET /api/admin/users
    public function users(Request $request)
    {
        $this->requireAdmin($request);

        $query = User::withCount(['attempts', 'documents', 'mockTests']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            });
        }

        if ($plan = $request->get('plan')) {
            $query->where('plan', $plan);
        }

        $users = $query->latest()->paginate(20);

        return response()->json($users);
    }

    // PUT /api/admin/users/{id}
    public function updateUser(Request $request, $id)
    {
        $this->requireAdmin($request);

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'plan' => 'sometimes|in:free,pro',
            'is_admin' => 'sometimes|boolean',
            'name' => 'sometimes|string|max:255',
            'password' => 'sometimes|string|min:8',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json(['user' => $user, 'message' => 'User updated']);
    }

    // DELETE /api/admin/users/{id}
    public function deleteUser(Request $request, $id)
    {
        $this->requireAdmin($request);

        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Cannot delete yourself'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    // GET /api/admin/documents
    public function documents(Request $request)
    {
        $this->requireAdmin($request);

        $query = Document::with('user:id,name,email')->withCount('questions');

        if ($search = $request->get('search')) {
            $query->where('title', 'like', "%$search%");
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->latest()->paginate(20));
    }

    // DELETE /api/admin/documents/{id}
    public function deleteDocument(Request $request, $id)
    {
        $this->requireAdmin($request);

        $doc = Document::findOrFail($id);
        $doc->delete();

        return response()->json(['message' => 'Document deleted']);
    }

    // POST /api/admin/users/{id}/upgrade
    public function upgradeUser(Request $request, $id)
    {
        $this->requireAdmin($request);

        $user = User::findOrFail($id);
        $user->update([
            'plan' => 'pro',
            'plan_expires_at' => now()->addYear(),
        ]);

        return response()->json(['message' => "Upgraded {$user->name} to Pro"]);
    }

    // POST /api/admin/users/{id}/downgrade
    public function downgradeUser(Request $request, $id)
    {
        $this->requireAdmin($request);

        $user = User::findOrFail($id);
        $user->update([
            'plan' => 'free',
            'plan_expires_at' => null,
        ]);

        return response()->json(['message' => "Downgraded {$user->name} to Free"]);
    }
}
