import { createClient } from "@supabase/supabase-js";

// Baca konfigurasi dari .env.local. Prefix NEXT_PUBLIC_ artinya nilai ini
// disisipkan ke bundle browser saat build — memang disengaja, karena client
// Supabase berjalan di sisi browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Satu instance client dipakai bersama di seluruh aplikasi.
// Client inilah yang kita pakai untuk login (auth) dan baca/tulis database.
export const supabase = createClient(supabaseUrl, supabaseKey);
