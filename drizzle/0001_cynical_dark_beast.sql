ALTER TABLE IF EXISTS "subscriptions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "webhook_events" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE IF EXISTS "subscriptions" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "webhook_events" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_stripe_customer_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "generations_today";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "generations_reset_at";
