/* eslint-disable jsx-a11y/alt-text */
"use client";

import { GEIST_MONO_FONT, JETBRAINS_MONO_FONT, QUICKSAND_FONT } from "@/constants/pdf-fonts";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { Document, Page, Text, View, Image, Font } from "@react-pdf/renderer";
import { resolveBodyFontFamily } from "@/lib/invoice/resolve-pdf-font";
import { getInvoiceTotals } from "@/constants/pdf-helpers";
import { formatCurrencyText } from "@/constants/currency";
import { createTw } from "react-pdf-tailwind";
import { toWords } from "number-to-words";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import React from "react";

// Register fonts
Font.register({
  family: "GeistMono",
  fonts: GEIST_MONO_FONT,
});

Font.register({
  family: "Quicksand",
  fonts: QUICKSAND_FONT,
});

Font.register({
  family: "JetBrainsMono",
  fonts: JETBRAINS_MONO_FONT,
});

// Invoice PDF Document component
const DefaultPDF: React.FC<{ data: ZodCreateInvoiceSchema }> = ({ data }) => {
  const darkMode = data.invoiceDetails.theme.mode === "dark";
  // Calculate totals
  const totals = getInvoiceTotals(data);
  const subtotal = totals.subtotal;
  const total = totals.total;

  // Built per-render so the body font follows the selected theme font and so a CJK
  // fallback is appended only when the invoice actually contains Chinese (issue #48).
  // Applied as an explicit fontFamily array on the Page below — react-pdf-tailwind only
  // keeps the first family from a class, which would drop the CJK fallback.
  const bodyFontFamily = resolveBodyFontFamily(data, "Quicksand");
  const tw = createTw({
    theme: {
      fontFamily: {
        default: bodyFontFamily,
        geistmono: ["GeistMono"],
        jetbrainsmono: ["JetBrainsMono"],
      },
      extend: {
        colors: {
          darkmode: "#181818",
        },
        fontSize: {
          "2xs": "0.625rem",
          "3xs": "0.5rem",
        },
      },
    },
  });

  return (
    <Document
      title={`Invoice-${data.invoiceDetails.prefix}${data.invoiceDetails.serialNumber}`}
      author={data.companyDetails.name}
      creator={data.companyDetails.name}
      producer="Invoicely"
    >
      <Page
        size="A4"
        style={{
          ...tw(cn("p-6 text-sm", darkMode ? "text-white bg-darkmode" : "text-black bg-white")),
          fontFamily: bodyFontFamily,
        }}
      >
        <Text
          style={tw(
            cn(
              "text-2xl font-semibold font-jetbrainsmono tracking-tighter",
              darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`,
            ),
          )}
        >
          {data.companyDetails.name}
        </Text>
        <View style={tw("flex flex-row justify-between gap-6")}>
          <View style={tw("flex flex-col gap-1 w-1/2")}>
            <Text style={tw("text-2xs font-normal text-neutral-500")}>{data.companyDetails.address}</Text>
            {data.companyDetails.gstin && (
              <Text style={tw("text-2xs font-normal text-neutral-500")}>GSTIN {data.companyDetails.gstin}</Text>
            )}
            {(data.companyDetails.state || data.companyDetails.stateCode) && (
              <Text style={tw("text-2xs font-normal text-neutral-500")}>
                {data.companyDetails.state} {data.companyDetails.stateCode}
              </Text>
            )}
            {data.companyDetails.metadata.map((metadata) => (
              <View key={metadata.label} style={tw("flex flex-row items-center gap-1")}>
                <Text style={tw("text-2xs font-semibold")}>{metadata.label}</Text>
                <Text style={tw("text-2xs font-normal text-neutral-500")}>{metadata.value}</Text>
              </View>
            ))}
            {data.companyDetails.logo && (
              <Image
                style={{
                  aspectRatio: 16 / 9,
                  ...tw("mt-2 w-20 h-20 object-contain object-left"),
                }}
                src={data.companyDetails.logo}
              />
            )}
          </View>
          <View style={tw("flex flex-col gap-1 w-1/2")}>
            <View style={tw("flex flex-row items-center justify-between gap-3")}>
              <Text style={tw("text-2xs font-semibold")}>Invoice Number</Text>
              <Text style={tw("text-2xs font-normal text-neutral-500")}>
                {data.invoiceDetails.prefix}
                {data.invoiceDetails.serialNumber}
              </Text>
            </View>
            <View style={tw("flex flex-row items-center justify-between gap-3")}>
              <Text style={tw("text-2xs font-semibold")}>Date</Text>
              <Text style={tw("text-2xs font-normal text-neutral-500")}>
                {format(data.invoiceDetails.date, "dd/MM/yyyy")}
              </Text>
            </View>
            {data.invoiceDetails.dueDate && (
              <View style={tw("flex flex-row items-center justify-between gap-3")}>
                <Text style={tw("text-2xs font-semibold")}>Due Date</Text>
                <Text style={tw("text-2xs font-normal text-neutral-500")}>
                  {format(data.invoiceDetails.dueDate, "dd/MM/yyyy")}
                </Text>
              </View>
            )}
            {data.invoiceDetails.paymentTerms && (
              <View style={tw("flex flex-row items-center justify-between gap-3")}>
                <Text style={tw("text-2xs font-semibold")}>Payment Terms</Text>
                <Text style={tw("text-2xs font-normal text-neutral-500")}>{data.invoiceDetails.paymentTerms}</Text>
              </View>
            )}
            {data.invoiceDetails.poNumber && (
              <View style={tw("flex flex-row items-center justify-between gap-3")}>
                <Text style={tw("text-2xs font-semibold")}>PO Number</Text>
                <Text style={tw("text-2xs font-normal text-neutral-500")}>{data.invoiceDetails.poNumber}</Text>
              </View>
            )}
            {data.invoiceDetails.eWaybillNumber && (
              <View style={tw("flex flex-row items-center justify-between gap-3")}>
                <Text style={tw("text-2xs font-semibold")}>E-waybill</Text>
                <Text style={tw("text-2xs font-normal text-neutral-500")}>{data.invoiceDetails.eWaybillNumber}</Text>
              </View>
            )}
          </View>
        </View>
        {/* Invoice billing details */}
        <View style={tw("flex flex-row mt-[18px] w-full gap-2.5")}>
          <View
            style={tw(cn("flex flex-col gap-1.5 p-2.5 w-1/2 rounded", darkMode ? "bg-neutral-800" : "bg-neutral-100"))}
          >
            <Text
              style={tw(cn("font-semibold", darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`))}
            >
              Billed To
            </Text>
            <Text style={tw("text-2xs font-semibold")}>{data.billingClientDetails.name}</Text>
            <Text style={tw("text-2xs font-normal text-neutral-500")}>{data.billingClientDetails.address}</Text>
            {data.billingClientDetails.gstin && (
              <Text style={tw("text-2xs font-normal text-neutral-500")}>GSTIN {data.billingClientDetails.gstin}</Text>
            )}
            {(data.billingClientDetails.state || data.billingClientDetails.stateCode) && (
              <Text style={tw("text-2xs font-normal text-neutral-500")}>
                {data.billingClientDetails.state} {data.billingClientDetails.stateCode}
              </Text>
            )}
            {data.billingClientDetails.metadata.map((metadata) => (
              <View key={metadata.label} style={tw("flex flex-row items-center gap-1")}>
                <Text style={tw("text-2xs font-semibold")}>{metadata.label}</Text>
                <Text style={tw("text-2xs font-normal text-neutral-500")}>{metadata.value}</Text>
              </View>
            ))}
          </View>
          <View
            style={tw(cn("flex flex-col gap-1.5 p-2.5 w-1/2 rounded", darkMode ? "bg-neutral-800" : "bg-neutral-100"))}
          >
            <Text
              style={tw(cn("font-semibold", darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`))}
            >
              Shipped To
            </Text>
            <Text style={tw("text-2xs font-semibold")}>{data.shippingClientDetails.name}</Text>
            <Text style={tw("text-2xs font-normal text-neutral-500")}>{data.shippingClientDetails.address}</Text>
            {data.shippingClientDetails.gstin && (
              <Text style={tw("text-2xs font-normal text-neutral-500")}>GSTIN {data.shippingClientDetails.gstin}</Text>
            )}
            {(data.shippingClientDetails.state || data.shippingClientDetails.stateCode) && (
              <Text style={tw("text-2xs font-normal text-neutral-500")}>
                {data.shippingClientDetails.state} {data.shippingClientDetails.stateCode}
              </Text>
            )}
            {data.shippingClientDetails.metadata.map((metadata) => (
              <View key={metadata.label} style={tw("flex flex-row items-center gap-1")}>
                <Text style={tw("text-2xs font-semibold")}>{metadata.label}</Text>
                <Text style={tw("text-2xs font-normal text-neutral-500")}>{metadata.value}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Items Table */}
        <View style={tw("mt-5 grow")}>
          <View
            fixed
            style={[
              tw(
                cn(
                  "flex-row flex items-center px-2.5 pt-2.5 pb-1.5 font-bold text-2xs rounded text-white",
                  darkMode ? "bg-neutral-700" : `bg-[${data.invoiceDetails.theme.baseColor}]`,
                ),
              ),
            ]}
          >
            <Text style={tw("w-[38%]")}>Item</Text>
            <Text style={tw("w-[10%] text-center")}>HSN/SAC</Text>
            <Text style={tw("w-[10%] text-center")}>Qty</Text>
            <Text style={tw("w-[10%] text-center")}>Units</Text>
            <Text style={tw("w-[12%] text-right")}>Price</Text>
            <Text style={tw("w-[15%] text-right")}>GST</Text>
            <Text style={tw("w-[15%] text-right")}>Total</Text>
          </View>
          <View style={tw("flex flex-col mt-1")}>
            {data.items.map((item, index) => (
              <View
                key={index}
                wrap={false}
                style={tw(
                  cn(
                    "flex-row p-2 text-2xs rounded",
                    index % 2 === 0
                      ? darkMode
                        ? "bg-darkmode"
                        : "bg-white"
                      : darkMode
                        ? "bg-neutral-800"
                        : "bg-neutral-100",
                  ),
                )}
              >
                <View style={tw("flex flex-col gap-1 w-[38%]")}>
                  <Text style={tw("w-full text-sm font-semibold")}>{item.name}</Text>
                  <Text style={tw("text-xs font-normal text-neutral-600")}>{item.description}</Text>
                  {item.metadata.map((metadata) => (
                    <Text key={metadata.label} style={tw("text-xs font-normal text-neutral-600")}>
                      {metadata.label}: {metadata.value}
                    </Text>
                  ))}
                </View>
                <Text style={tw("w-[10%] text-sm text-center font-geistmono tracking-tighter")}>{item.hsnSac}</Text>
                <Text style={tw("w-[10%] text-sm text-center font-geistmono tracking-tighter")}>{item.quantity}</Text>
                <Text style={tw("w-[10%] text-sm text-center font-geistmono tracking-tighter")}>{item.units}</Text>
                <Text style={tw("w-[12%] text-sm text-right font-geistmono tracking-tighter")}>
                  {formatCurrencyText(data.invoiceDetails.currency, item.unitPrice)}
                </Text>
                <View style={tw("w-[15%] flex flex-col items-end")}>
                  <Text style={tw("text-sm text-right font-geistmono tracking-tighter")}>
                    {formatCurrencyText(data.invoiceDetails.currency, totals.itemTotals[index]?.totalTax ?? 0)}
                  </Text>
                  <Text style={tw("text-3xs text-right font-normal text-neutral-500")}>{formatGstRateText(item)}</Text>
                </View>
                <Text style={tw("w-[15%] text-sm text-right font-geistmono tracking-tighter")}>
                  {formatCurrencyText(data.invoiceDetails.currency, totals.itemTotals[index]?.total ?? 0)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/* Invoice meta data and pricing */}
        <View wrap={false} style={tw("flex flex-row gap-[50px]")}>
          <View style={tw("flex flex-col gap-[15px] justify-end w-1/2")}>
            {/* Payment Information */}
            {data.metadata.paymentInformation.length ? (
              <View style={tw("flex flex-col gap-0.5 pr-2.5")}>
                <Text
                  style={tw(
                    cn("font-semibold", darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`),
                  )}
                >
                  Payment Information
                </Text>
                <View style={tw("flex flex-col gap-0.5 mt-1")}>
                  {data.metadata.paymentInformation.map((paymentInformation, index) => {
                    return (
                      <View key={index} style={tw("flex flex-row items-center gap-1")}>
                        <Text style={tw("text-2xs font-semibold min-w-[100px]")}>{paymentInformation.label}</Text>
                        <Text style={tw("text-2xs font-normal text-neutral-500")}>{paymentInformation.value}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
            {/* Terms and conditions */}
            {data.metadata.terms && (
              <View style={tw("flex flex-col gap-0.5 pr-2.5")}>
                <Text
                  style={tw(
                    cn("font-semibold", darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`),
                  )}
                >
                  Terms
                </Text>
                <Text style={tw("text-2xs font-normal text-neutral-500 mt-1")}>{data.metadata.terms}</Text>
              </View>
            )}
            {/* Notes */}
            {data.metadata.notes && (
              <View style={tw("flex flex-col gap-0.5 pr-2.5")}>
                <Text
                  style={tw(
                    cn("font-semibold", darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`),
                  )}
                >
                  Notes
                </Text>
                <Text style={tw("text-2xs font-normal text-neutral-500 mt-1")}>{data.metadata.notes}</Text>
              </View>
            )}
          </View>
          {/* Pricing  */}
          <View style={tw("flex flex-col gap-1 p-2.5 w-1/2 min-w-[50%] justify-end")}>
            {/* Signature */}
            {data.companyDetails.signature && (
              <View style={tw("flex flex-col gap-1 mb-1.5 items-end w-full")}>
                <Text style={tw("text-3xs font-normal text-neutral-500")}>Verified by {data.companyDetails.name}</Text>
                <Image
                  style={{
                    aspectRatio: 1 / 1,
                    ...tw("h-20 w-20 rounded-lg object-cover"),
                  }}
                  src={data.companyDetails.signature}
                />
              </View>
            )}
            <View style={tw("flex flex-row items-center justify-between")}>
              <Text style={tw("text-2xs font-semibold")}>Subtotal</Text>
              <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-500")}>
                {formatCurrencyText(data.invoiceDetails.currency, subtotal)}
              </Text>
            </View>
            {totals.cgstTotal > 0 && (
              <View style={tw("flex flex-row items-center justify-between")}>
                <Text style={tw("text-2xs font-semibold")}>CGST</Text>
                <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-500")}>
                  {formatCurrencyText(data.invoiceDetails.currency, totals.cgstTotal)}
                </Text>
              </View>
            )}
            {totals.sgstTotal > 0 && (
              <View style={tw("flex flex-row items-center justify-between")}>
                <Text style={tw("text-2xs font-semibold")}>SGST</Text>
                <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-500")}>
                  {formatCurrencyText(data.invoiceDetails.currency, totals.sgstTotal)}
                </Text>
              </View>
            )}
            {totals.igstTotal > 0 && (
              <View style={tw("flex flex-row items-center justify-between")}>
                <Text style={tw("text-2xs font-semibold")}>IGST</Text>
                <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-500")}>
                  {formatCurrencyText(data.invoiceDetails.currency, totals.igstTotal)}
                </Text>
              </View>
            )}
            {/* Billing Details */}
            {data.invoiceDetails.billingDetails.map((billingDetail, index) => {
              if (billingDetail.type === "percentage") {
                return (
                  <View key={index} style={tw("flex flex-row items-center justify-between")}>
                    <Text style={tw("text-2xs font-semibold")}>{billingDetail.label}</Text>
                    <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-500")}>
                      {billingDetail.value} %
                    </Text>
                  </View>
                );
              }

              return (
                <View key={index} style={tw("flex flex-row items-center justify-between")}>
                  <Text style={tw("text-2xs font-semibold")}>{billingDetail.label}</Text>
                  <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-500")}>
                    {formatCurrencyText(data.invoiceDetails.currency, billingDetail.value)}
                  </Text>
                </View>
              );
            })}
            <View
              style={tw(cn("border-b mt-1.5 mb-1.5", darkMode ? "border-neutral-800" : "border-neutral-200"))}
            ></View>
            <View style={tw("flex flex-row items-center justify-between")}>
              <Text style={tw("text-xs font-semibold")}>Total</Text>
              <Text style={tw("text-lg font-geistmono tracking-tight")}>
                {formatCurrencyText(data.invoiceDetails.currency, total)}
              </Text>
            </View>
            <View style={tw("flex flex-col gap-0.5 mt-1")}>
              <Text style={tw("text-3xs font-normal text-neutral-500")}>Invoice Total (in words)</Text>
              <Text style={tw("text-2xs font-normal")}>{toWords(total)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const formatGstRateText = (item: ZodCreateInvoiceSchema["items"][number]) => {
  const rates = [
    item.cgstRate > 0 ? `CGST ${item.cgstRate}%` : null,
    item.sgstRate > 0 ? `SGST ${item.sgstRate}%` : null,
    item.igstRate > 0 ? `IGST ${item.igstRate}%` : null,
  ].filter(Boolean);

  return rates.length > 0 ? rates.join(" + ") : "No GST";
};

export default DefaultPDF;
