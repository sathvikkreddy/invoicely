CREATE TYPE "public"."invoice_status" AS ENUM('pending', 'success', 'error', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."invoice_value_types" AS ENUM('fixed', 'percentage');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_billing_client_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"gstin" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"state_code" text DEFAULT '' NOT NULL,
	"invoice_field_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_billing_client_details_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"invoice_billing_client_details_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_company_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"gstin" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"state_code" text DEFAULT '' NOT NULL,
	"logo" text,
	"signature" text,
	"invoice_field_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_company_details_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"invoice_company_details_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme" jsonb NOT NULL,
	"currency" text NOT NULL,
	"prefix" text NOT NULL,
	"serial_number" text NOT NULL,
	"date" timestamp NOT NULL,
	"due_date" timestamp,
	"po_number" text DEFAULT '' NOT NULL,
	"e_waybill_number" text DEFAULT '' NOT NULL,
	"payment_terms" text DEFAULT '' NOT NULL,
	"invoice_field_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_details_billing_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"type" "invoice_value_types" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"invoice_details_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_item_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"invoice_item_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"hsn_sac" text DEFAULT '' NOT NULL,
	"quantity" integer NOT NULL,
	"units" text DEFAULT 'Nos' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"cgst_rate" numeric(5, 2) DEFAULT 9 NOT NULL,
	"sgst_rate" numeric(5, 2) DEFAULT 9 NOT NULL,
	"igst_rate" numeric(5, 2) DEFAULT 0 NOT NULL,
	"invoice_field_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notes" text NOT NULL,
	"terms" text NOT NULL,
	"invoice_field_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_metadata_payment_information" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"invoice_metadata_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_shipping_client_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"same_as_billing" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"gstin" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"state_code" text DEFAULT '' NOT NULL,
	"invoice_field_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_shipping_client_details_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"invoice_shipping_client_details_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "invoice_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"billing_name" text NOT NULL,
	"billing_address" text NOT NULL,
	"billing_gstin" text NOT NULL,
	"billing_state" text NOT NULL,
	"billing_state_code" text NOT NULL,
	"billing_metadata" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"same_as_billing" boolean DEFAULT true NOT NULL,
	"shipping_name" text NOT NULL,
	"shipping_address" text NOT NULL,
	"shipping_gstin" text NOT NULL,
	"shipping_state" text NOT NULL,
	"shipping_state_code" text NOT NULL,
	"shipping_metadata" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_billing_client_details" ADD CONSTRAINT "invoice_billing_client_details_invoice_field_id_invoice_fields_id_fk" FOREIGN KEY ("invoice_field_id") REFERENCES "public"."invoice_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_billing_client_details_metadata" ADD CONSTRAINT "invoice_billing_client_details_metadata_invoice_billing_client_details_id_invoice_billing_client_details_id_fk" FOREIGN KEY ("invoice_billing_client_details_id") REFERENCES "public"."invoice_billing_client_details"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_company_details" ADD CONSTRAINT "invoice_company_details_invoice_field_id_invoice_fields_id_fk" FOREIGN KEY ("invoice_field_id") REFERENCES "public"."invoice_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_company_details_metadata" ADD CONSTRAINT "invoice_company_details_metadata_invoice_company_details_id_invoice_company_details_id_fk" FOREIGN KEY ("invoice_company_details_id") REFERENCES "public"."invoice_company_details"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_details" ADD CONSTRAINT "invoice_details_invoice_field_id_invoice_fields_id_fk" FOREIGN KEY ("invoice_field_id") REFERENCES "public"."invoice_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_details_billing_details" ADD CONSTRAINT "invoice_details_billing_details_invoice_details_id_invoice_details_id_fk" FOREIGN KEY ("invoice_details_id") REFERENCES "public"."invoice_details"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_fields" ADD CONSTRAINT "invoice_fields_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_item_metadata" ADD CONSTRAINT "invoice_item_metadata_invoice_item_id_invoice_items_id_fk" FOREIGN KEY ("invoice_item_id") REFERENCES "public"."invoice_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_field_id_invoice_fields_id_fk" FOREIGN KEY ("invoice_field_id") REFERENCES "public"."invoice_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_metadata" ADD CONSTRAINT "invoice_metadata_invoice_field_id_invoice_fields_id_fk" FOREIGN KEY ("invoice_field_id") REFERENCES "public"."invoice_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_metadata_payment_information" ADD CONSTRAINT "invoice_metadata_payment_information_invoice_metadata_id_invoice_metadata_id_fk" FOREIGN KEY ("invoice_metadata_id") REFERENCES "public"."invoice_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_shipping_client_details" ADD CONSTRAINT "invoice_shipping_client_details_invoice_field_id_invoice_fields_id_fk" FOREIGN KEY ("invoice_field_id") REFERENCES "public"."invoice_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_shipping_client_details_metadata" ADD CONSTRAINT "invoice_shipping_client_details_metadata_invoice_shipping_client_details_id_invoice_shipping_client_details_id_fk" FOREIGN KEY ("invoice_shipping_client_details_id") REFERENCES "public"."invoice_shipping_client_details"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_user_id_billing_gstin_unique" ON "clients" USING btree ("user_id","billing_gstin");