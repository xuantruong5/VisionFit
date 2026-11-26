<?php

namespace App\Services\Assistant;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Trainer;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Immutable authenticated identity resolved exclusively from verified Bearer Token.
 * Never trusts user_id, gym_id, or role from client input or LLM tool arguments.
 */
class AssistantAuthContext
{
    public function __construct(
        public readonly bool $authenticated,
        public readonly ?string $userId = null,
        public readonly ?string $gymId = null,
        public readonly ?string $role = null,
        public readonly ?string $name = null,
        public readonly ?object $user = null,
        private readonly ?string $rawBearerToken = null,
    ) {
    }

    public function bearerToken(): ?string
    {
        return $this->rawBearerToken;
    }

    public static function guest(?string $rawBearerToken = null): self
    {
        return new self(false, null, null, null, null, null, $rawBearerToken);
    }

    public static function fromRequest(Request $request): self
    {
        $plainToken = $request->bearerToken();
        $existingUser = $request->attributes->get('assistant_user');
        $existingIdentity = $request->attributes->get('assistant_identity');
        if ($existingUser && is_array($existingIdentity)) {
            return new self(
                authenticated: true,
                userId: (string) ($existingIdentity['id'] ?? $existingUser->getKey()),
                gymId: isset($existingIdentity['gym_id']) ? (string) $existingIdentity['gym_id'] : null,
                role: (string) ($existingIdentity['role'] ?? 'member'),
                name: (string) ($existingIdentity['name'] ?? ($existingUser->ho_ten ?? 'Người dùng VisionFit')),
                user: $existingUser,
                rawBearerToken: $plainToken,
            );
        }

        if (!$plainToken) {
            return self::guest();
        }

        $token = PersonalAccessToken::findToken($plainToken);
        $expiration = config('sanctum.expiration');
        $isExpired = !$token
            || ($token->expires_at && $token->expires_at->isPast())
            || ($expiration && $token->created_at->lte(now()->subMinutes((int) $expiration)));

        if ($isExpired || (!$token->can('*') && !$token->can('assistant:read'))) {
            return self::guest($plainToken);
        }

        $user = $token->tokenable;
        $role = match (true) {
            $user instanceof Client => 'member',
            $user instanceof Trainer => 'trainer',
            $user instanceof Admin => 'admin',
            default => null,
        };

        $isActive = $role !== null
            && (int) ($user->tinh_trang ?? 0) === 1
            && (int) ($user->is_block ?? 0) !== 1
            && ($role !== 'trainer' || (int) ($user->is_active ?? 0) === 1);

        if (!$isActive) {
            return self::guest($plainToken);
        }

        $rawGymId = $role === 'admin'
            ? config('assistant.admin_gyms.' . (string) $user->getKey())
            : ($user->id_phong_tap ?? null);

        $hasValidGym = is_scalar($rawGymId) && ctype_digit((string) $rawGymId) && (int) $rawGymId > 0;
        if (!$hasValidGym) {
            if ($role !== 'member') {
                return self::guest($plainToken);
            }
            $gymId = '0';
        } else {
            $gymId = (string) $rawGymId;
        }

        $identity = [
            'id' => (string) $user->getKey(),
            'gym_id' => $gymId,
            'role' => $role,
            'name' => (string) ($user->ho_ten ?? 'Người dùng VisionFit'),
        ];

        $request->attributes->set('assistant_user', $user);
        $request->attributes->set('assistant_identity', $identity);

        return new self(
            authenticated: true,
            userId: $identity['id'],
            gymId: $identity['gym_id'],
            role: $identity['role'],
            name: $identity['name'],
            user: $user,
            rawBearerToken: $plainToken,
        );
    }

    public function toIdentityArray(): ?array
    {
        if (!$this->authenticated) {
            return null;
        }

        return [
            'id' => $this->userId,
            'gym_id' => $this->gymId,
            'role' => $this->role,
            'name' => $this->name,
        ];
    }
}

