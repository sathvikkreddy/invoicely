CREATE TABLE "invoice_defaults" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"company_details" jsonb NOT NULL,
	"client_details" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_defaults" ADD CONSTRAINT "invoice_defaults_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "allowed_saving_data";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "type";--> statement-breakpoint
DROP TYPE "public"."invoice_type";