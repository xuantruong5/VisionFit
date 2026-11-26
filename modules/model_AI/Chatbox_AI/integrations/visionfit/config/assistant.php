<?php

return [
    // Admin has no id_phong_tap in the current schema. A trusted operator must
    // explicitly bind each admin ID to one gym ID. Unmapped admins get HTTP 403.
    // Example after verifying ownership: 12 => 3,
    'admin_gyms' => [],
];
