import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
// Note: Normally an admin script uses a Service Role Key, but for seeding 
// public match data without RLS restricting us (since matches table has no insert policies yet),
// we might need to use the service role key. Let's see if the anon key works if we bypass RLS or just use it.
// Actually, in our schema: "Only Supabase Admins (via Service Role Key) should be able to Insert/Update/Delete matches."
// But for this initial seed, if RLS is enabled but no insert policy exists, insertion will fail with anon key.
// To fix this for the seed script, we can instruct the user to run it with their service role key or 
// we temporarily disable RLS on matches, seed, and re-enable.
// Or we can just generate a SQL insert statement! That's much safer and easier for the user to run in the Supabase UI.

console.log("To seed matches easily without exposing service keys, please run the following SQL in your Supabase SQL Editor:")
console.log(`
INSERT INTO public.matches (home_team, away_team, kickoff_time, stage, multiplier) VALUES
('USA', 'Wales', '2026-06-15 15:00:00+00', 'Group', 1),
('Mexico', 'Poland', '2026-06-16 18:00:00+00', 'Group', 1),
('Canada', 'Morocco', '2026-06-17 12:00:00+00', 'Group', 1),
('Argentina', 'Saudi Arabia', '2026-06-18 10:00:00+00', 'Group', 1),
('Brazil', 'Serbia', '2026-06-19 20:00:00+00', 'Group', 1),
('France', 'Australia', '2026-06-20 16:00:00+00', 'Group', 1),
('Spain', 'Costa Rica', '2026-06-21 14:00:00+00', 'Group', 1),
('Germany', 'Japan', '2026-06-22 18:00:00+00', 'Group', 1);
`)

// Instead of fighting RLS, we just output the SQL for them to run.
