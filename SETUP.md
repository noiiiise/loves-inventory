# Loves Inventory — Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning

## 2. Apply the Schema

In your Supabase project, go to **SQL Editor** and run the following files in order:

1. `supabase/schema.sql` — creates all tables and the current_inventory view
2. `supabase/functions.sql` — creates the atomic RPC functions
3. `supabase/seed.sql` — inserts the 5 locations, 16 flavors, 2 pack sizes, and default thresholds

## 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase project values:

```bash
cp .env.local.example .env.local
```

Find your values in Supabase under **Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` — your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` public key

## 4. Update the 16 Flavors

The seed file includes placeholder flavor names. Before running seed.sql, edit `supabase/seed.sql` and replace the flavor names under `-- 16 Flavors` with Loves' actual flavor list.

## 5. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 6. Deploy to Vercel

1. Push this folder to a GitHub repository
2. Import the repo in [vercel.com](https://vercel.com)
3. Add the two environment variables in Vercel's project settings
4. Deploy — Vercel auto-detects Next.js

---

## Location IDs

| ID | Name |
|----|------|
| `igloo` | The Igloo (Downtown GR) |
| `ada` | Ada Scoop Shop |
| `holland` | Holland Scoop Shop |
| `amphitheater` | Amphitheater |
| `meijer` | Fredrick Meijer Gardens |

## Future Locations

To add a new location (Hudsonville, Cedarcrest, VIP freezers, etc.), just insert a row into the `locations` table — no schema changes needed:

```sql
insert into locations (id, name, type, sort_order)
values ('hudsonville', 'Hudsonville (Ingredients)', 'ingredient_warehouse', 5);
```
