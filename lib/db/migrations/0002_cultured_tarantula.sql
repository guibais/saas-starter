CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"address" text,
	"phone" varchar(20),
	"delivery_instructions" text,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "customers_email_unique" UNIQUE("email"),
	CONSTRAINT "customers_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "user_id" TO "customer_id";--> statement-breakpoint
ALTER TABLE "user_subscriptions" RENAME COLUMN "user_id" TO "customer_id";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_subscriptions" DROP CONSTRAINT "user_subscriptions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "product_type" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "product_type" SET DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "price" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_product_id" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_price_id" varchar(255);--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "stripe_product_id" varchar(255);--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "stripe_price_id" varchar(255);--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "plan_name" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;