// The single private Supabase Storage bucket holding original masters and the
// stamped, licensed derivatives (under the `stamped/` prefix). Referenced by
// every storage.from(...) call so the bucket name cannot drift per-route again
// (PAY-02: code had been targeting a non-existent 'photos' bucket).
export const MASTERS_BUCKET = 'photo-masters';
