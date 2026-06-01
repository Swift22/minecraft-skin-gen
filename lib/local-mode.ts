export const IS_LOCAL_MODE = process.env.LOCAL_MODE === 'true'

// Hardcoded mock user returned in place of DB/Supabase calls
export const LOCAL_USER = {
  id: 'local-dev-user',
  email: 'local@dev.local',
  createdAt: new Date(0).toISOString(),
}
