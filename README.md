# Minecraft Skin Gen

AI Minecraft skin generator powered by Google Gemini. Type a character idea, optionally upload a reference image, preview the result, and download a 64x64 PNG skin for Minecraft Java Edition.

The app is free, unlimited, and ad-free.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Drizzle ORM
- Supabase Auth, Postgres, and Storage
- Google Gemini via `@google/genai`

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in the required values:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   DATABASE_URL=
   GEMINI_API_KEY=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Run database migrations:

   ```bash
   npx drizzle-kit migrate
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start the local Next.js dev server
- `npm run build` - build for production
- `npm run start` - run the production server
- `npm test` - run Vitest

## Local Mode

For quick local generation without Supabase auth, set:

```bash
LOCAL_MODE=true
GEMINI_API_KEY=your_gemini_api_key_here
```
