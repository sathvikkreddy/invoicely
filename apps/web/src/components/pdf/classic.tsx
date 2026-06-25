/* eslint-disable jsx-a11y/alt-text */
"use client";

import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { Document, Font, Image, Page, Text, View } from "@react-pdf/renderer";
import { resolveBodyFontFamily } from "@/lib/invoice/resolve-pdf-font";
import { getInvoiceTotals } from "@/constants/pdf-helpers";
import { formatCurrencyText } from "@/constants/currency";
import { GEIST_MONO_FONT } from "@/constants/pdf-fonts";
import { createTw } from "react-pdf-tailwind";
import { toWords } from "number-to-words";
import { format } from "date-fns";
import React from "react";

Font.register({
  family: "GeistMono",
  fonts: GEIST_MONO_FONT,
});

const line = { borderColor: "#000000", borderStyle: "solid" } as const;
const rightLine = { ...line, borderRightWidth: 1 };
const bottomLine = { ...line, borderBottomWidth: 1 };
const cellPadding = "px-1.5 py-1";

const ClassicPdf: React.FC<{ data: ZodCreateInvoiceSchema }> = ({ data }) => {
  const totals = getInvoiceTotals(data);
  const bodyFontFamily = resolveBodyFontFamily(data, "Times-Roman");
  const tw = createTw({
    theme: {
      fontFamily: {
        default: bodyFontFamily,
        mono: ["GeistMono"],
      },
      extend: {
        fontSize: {
          "2xs": "0.625rem",
          "3xs": "0.5rem",
        },
      },
    },
  });
  const totalQuantity = data.items.reduce((acc, item) => acc + item.quantity, 0);

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
          ...tw("p-4 text-xs bg-white text-black"),
          fontFamily: bodyFontFamily,
        }}
      >
        <View style={[tw("flex flex-col h-full"), line, { borderWidth: 2 }]}>
          <Header data={data} tw={tw} />
          <InvoiceIdentity data={data} tw={tw} />
          <PartyBlocks data={data} tw={tw} />
          <ItemsTable data={data} totals={totals} tw={tw} />
          <SummaryBlocks data={data} totals={totals} totalQuantity={totalQuantity} tw={tw} />
          <Text style={tw("text-center text-2xs py-0.5")}>Subject to local jurisdiction only</Text>
        </View>
      </Page>
    </Document>
  );
};

interface PdfSectionProps {
  data: ZodCreateInvoiceSchema;
  tw: ReturnType<typeof createTw>;
}

const Header = ({ data, tw }: PdfSectionProps) => {
  return (
    <View style={[tw("items-center px-3 py-2"), bottomLine]}>
      <Text style={tw("text-2xl font-bold text-center uppercase")}>{data.companyDetails.name}</Text>
      <Text style={tw("text-xs text-center mt-1")}>{data.companyDetails.address}</Text>
      {data.companyDetails.metadata.map((metadata) => (
        <Text key={metadata.label} style={tw("text-xs text-center mt-0.5")}>
          {metadata.label}: {metadata.value}
        </Text>
      ))}
      {data.companyDetails.gstin ? (
        <Text style={tw("text-xs text-center mt-0.5")}>GSTIN: {data.companyDetails.gstin}</Text>
      ) : null}
    </View>
  );
};

const InvoiceIdentity = ({ data, tw }: PdfSectionProps) => {
  return (
    <>
      <View style={[tw("flex-row"), bottomLine]}>
        <View style={[tw("w-[80%] items-center py-1"), rightLine]}>
          <Text style={tw("text-lg font-bold uppercase")}>Tax Invoice</Text>
        </View>
        <View style={tw("w-[20%]")}>
          {["Original", "Duplicate", "Triplicate"].map((copyLabel, index) => (
            <Text key={copyLabel} style={[tw("text-xs px-1 py-0.5"), index < 2 ? bottomLine : {}]}>
              {copyLabel}
            </Text>
          ))}
        </View>
      </View>
      <View style={[tw("flex-row"), bottomLine]}>
        <LabeledValue
          label="Invoice No."
          value={`${data.invoiceDetails.prefix}${data.invoiceDetails.serialNumber}`}
          tw={tw}
          className="w-1/2"
          strong
        />
        <LabeledValue
          label="Invoice Date"
          value={format(data.invoiceDetails.date, "dd-MM-yyyy")}
          tw={tw}
          className="w-1/2"
          strong
          borderedLeft
        />
      </View>
      <View style={[tw("flex-row"), bottomLine]}>
        <LabeledValue
          label="State"
          value={`${data.companyDetails.state}${data.companyDetails.stateCode ? `  Code: ${data.companyDetails.stateCode}` : ""}`}
          tw={tw}
          className="w-1/2"
        />
        <LabeledValue
          label="E-Way Bill No."
          value={data.invoiceDetails.eWaybillNumber || ""}
          tw={tw}
          className="w-1/2"
          borderedLeft
        />
      </View>
      <View style={[tw("flex-row"), bottomLine]}>
        <LabeledValue label="P.O No. and Date" value={data.invoiceDetails.poNumber || ""} tw={tw} className="w-1/2" />
        <LabeledValue
          label="Payment Terms"
          value={data.invoiceDetails.paymentTerms || ""}
          tw={tw}
          className="w-1/2"
          borderedLeft
        />
      </View>
    </>
  );
};

interface LabeledValueProps {
  label: string;
  value: string;
  tw: ReturnType<typeof createTw>;
  className: string;
  strong?: boolean;
  borderedLeft?: boolean;
}

const LabeledValue = ({ label, value, tw, className, strong = false, borderedLeft = false }: LabeledValueProps) => (
  <View style={[tw(`flex-row ${cellPadding} ${className}`), borderedLeft ? { ...line, borderLeftWidth: 1 } : {}]}>
    <Text style={tw("w-[35%] font-bold")}>{label}:</Text>
    <Text style={tw(strong ? "flex-1 font-bold" : "flex-1")}>{value}</Text>
  </View>
);

const PartyBlocks = ({ data, tw }: PdfSectionProps) => {
  return (
    <View style={[tw("flex-row"), bottomLine]}>
      <PartyBlock title="Bill To" party={data.billingClientDetails} tw={tw} />
      <PartyBlock title="Ship To" party={data.shippingClientDetails} tw={tw} borderedLeft />
    </View>
  );
};

interface PartyBlockProps {
  title: string;
  party: ZodCreateInvoiceSchema["billingClientDetails"] | ZodCreateInvoiceSchema["shippingClientDetails"];
  tw: ReturnType<typeof createTw>;
  borderedLeft?: boolean;
}

const PartyBlock = ({ title, party, tw, borderedLeft = false }: PartyBlockProps) => (
  <View style={[tw("w-1/2"), borderedLeft ? { ...line, borderLeftWidth: 1 } : {}]}>
    <Text style={[tw("px-1.5 py-0.5 font-bold"), bottomLine]}>{title}</Text>
    <View style={tw("px-1.5 py-1 min-h-[68px]")}>
      <Text style={tw("font-bold")}>Name: {party.name}</Text>
      <Text style={tw("mt-1")}>Address: {party.address}</Text>
      {party.gstin ? <Text style={tw("mt-1")}>GSTIN: {party.gstin}</Text> : null}
      <Text style={tw("mt-1")}>
        State: {party.state}
        {party.stateCode ? `   Code: ${party.stateCode}` : ""}
      </Text>
      {party.metadata.map((metadata) => (
        <Text key={metadata.label} style={tw("mt-0.5")}>
          {metadata.label}: {metadata.value}
        </Text>
      ))}
    </View>
  </View>
);

interface ItemsTableProps extends PdfSectionProps {
  totals: ReturnType<typeof getInvoiceTotals>;
}

const ItemsTable = ({ data, totals, tw }: ItemsTableProps) => {
  return (
    <View style={tw("grow")}>
      <View fixed style={[tw("flex-row font-bold"), bottomLine]}>
        <TableHeaderCell width="w-[7%]" tw={tw}>
          Sl. No
        </TableHeaderCell>
        <TableHeaderCell width="w-[39%]" tw={tw}>
          Product Description
        </TableHeaderCell>
        <TableHeaderCell width="w-[12%]" tw={tw}>
          HSN Code
        </TableHeaderCell>
        <TableHeaderCell width="w-[10%]" tw={tw}>
          Quantity
        </TableHeaderCell>
        <TableHeaderCell width="w-[8%]" tw={tw}>
          Units
        </TableHeaderCell>
        <TableHeaderCell width="w-[12%]" tw={tw}>
          Unit Price
        </TableHeaderCell>
        <TableHeaderCell width="w-[12%]" tw={tw} last>
          Amount
        </TableHeaderCell>
      </View>
      {data.items.map((item, index) => (
        <View key={index} wrap={false} style={[tw("flex-row min-h-[54px]"), bottomLine]}>
          <TableCell width="w-[7%]" tw={tw} align="text-center">
            {index + 1}
          </TableCell>
          <View style={[tw("w-[39%] px-1.5 py-1"), rightLine]}>
            <Text style={tw("font-bold uppercase")}>{item.name}</Text>
            <Text style={tw("mt-1")}>{item.description1}</Text>
            {item.description2 ? <Text style={tw("mt-1")}>{item.description2}</Text> : null}
            {item.metadata.map((metadata) => (
              <Text key={metadata.label} style={tw("mt-1")}>
                {metadata.value}
              </Text>
            ))}
          </View>
          <TableCell width="w-[12%]" tw={tw} align="text-center">
            {item.hsnSac}
          </TableCell>
          <TableCell width="w-[10%]" tw={tw} align="text-right">
            {item.quantity}
          </TableCell>
          <TableCell width="w-[8%]" tw={tw} align="text-right">
            {item.units}
          </TableCell>
          <TableCell width="w-[12%]" tw={tw} align="text-right">
            {formatNumber(item.unitPrice)}
          </TableCell>
          <TableCell width="w-[12%]" tw={tw} align="text-right" last>
            {formatNumber(totals.itemTotals[index]?.taxableAmount ?? 0)}
          </TableCell>
        </View>
      ))}
    </View>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  width: string;
  tw: ReturnType<typeof createTw>;
  align?: "text-left" | "text-center" | "text-right";
  last?: boolean;
}

const TableHeaderCell = ({ children, width, tw, last = false }: TableCellProps) => (
  <Text style={[tw(`${width} ${cellPadding} text-center`), last ? {} : rightLine]}>{children}</Text>
);

const TableCell = ({ children, width, tw, align = "text-left", last = false }: TableCellProps) => (
  <Text style={[tw(`${width} ${cellPadding} ${align}`), last ? {} : rightLine]}>{children}</Text>
);

interface SummaryBlocksProps extends PdfSectionProps {
  totals: ReturnType<typeof getInvoiceTotals>;
  totalQuantity: number;
}

const SummaryBlocks = ({ data, totals, totalQuantity, tw }: SummaryBlocksProps) => {
  return (
    <View wrap={false}>
      <View style={[tw("flex-row"), bottomLine]}>
        <Text style={[tw("w-[46%] px-1.5 py-1 text-right font-bold"), rightLine]}>Total Quantity:</Text>
        <Text style={[tw("w-[18%] px-1.5 py-1 text-right"), rightLine]}>{totalQuantity}</Text>
        <Text style={[tw("w-[18%] px-1.5 py-1 font-bold"), rightLine]}>Total:</Text>
        <Text style={tw("w-[18%] px-1.5 py-1 text-right")}>{formatNumber(totals.subtotal)}</Text>
      </View>
      <View style={[tw("flex-row"), bottomLine]}>
        <View style={[tw("w-[60%]"), rightLine]}>
          <View style={[tw("px-1.5 py-1 min-h-[46px]"), bottomLine]}>
            <Text>Amount (in words):</Text>
            <Text style={tw("font-bold mt-1 capitalize")}>{toWords(totals.total)} only</Text>
          </View>
          <PaymentAndNotes data={data} tw={tw} />
        </View>
        <View style={tw("w-[40%]")}>
          <TotalRow
            label="Taxable Amount"
            value={formatCurrencyText(data.invoiceDetails.currency, totals.subtotal)}
            tw={tw}
          />
          {data.invoiceDetails.billingDetails.map((billingDetail, index) => {
            const amount =
              billingDetail.type === "fixed" ? billingDetail.value : (totals.subtotal * billingDetail.value) / 100;

            return (
              <TotalRow
                key={index}
                label={
                  billingDetail.type === "percentage"
                    ? `${billingDetail.label} ${billingDetail.value}%`
                    : billingDetail.label
                }
                value={formatCurrencyText(data.invoiceDetails.currency, amount)}
                tw={tw}
              />
            );
          })}
          <TotalRow label="CGST" value={formatCurrencyText(data.invoiceDetails.currency, totals.cgstTotal)} tw={tw} />
          <TotalRow label="SGST" value={formatCurrencyText(data.invoiceDetails.currency, totals.sgstTotal)} tw={tw} />
          <TotalRow label="IGST" value={formatCurrencyText(data.invoiceDetails.currency, totals.igstTotal)} tw={tw} />
          <TotalRow
            label="Total Amount"
            value={formatCurrencyText(data.invoiceDetails.currency, totals.total)}
            tw={tw}
            strong
          />
        </View>
      </View>
      <View style={[tw("flex-row min-h-[58px]"), bottomLine]}>
        <View style={[tw("w-[70%] px-1.5 py-1"), rightLine]}>
          <Text style={tw("font-bold")}>Note:</Text>
          <Text style={tw("mt-1")}>{data.metadata.terms || data.metadata.notes || "Thank you for your business."}</Text>
        </View>
        <View style={tw("w-[30%] px-1.5 py-1 items-center justify-between")}>
          <Text style={tw("text-2xs text-center")}>For {data.companyDetails.name}</Text>
          {data.companyDetails.signature ? (
            <Image
              style={{
                aspectRatio: 2 / 1,
                ...tw("h-8 object-contain"),
              }}
              src={data.companyDetails.signature}
            />
          ) : (
            <View style={tw("h-8")} />
          )}
          <Text style={tw("text-2xs text-center")}>Authorised Signatory</Text>
        </View>
      </View>
    </View>
  );
};

const PaymentAndNotes = ({ data, tw }: PdfSectionProps) => (
  <View style={tw("px-1.5 py-1 min-h-[76px]")}>
    {data.metadata.paymentInformation.length ? (
      <>
        <Text style={tw("font-bold")}>Bank Details:</Text>
        {data.metadata.paymentInformation.map((paymentInformation) => (
          <Text key={paymentInformation.label} style={tw("mt-1")}>
            {paymentInformation.label}: {paymentInformation.value}
          </Text>
        ))}
      </>
    ) : (
      <>
        <Text style={tw("font-bold")}>Bank Details:</Text>
        <Text style={tw("mt-1")}>Add payment information to print bank details here.</Text>
      </>
    )}
  </View>
);

interface TotalRowProps {
  label: string;
  value: string;
  tw: ReturnType<typeof createTw>;
  strong?: boolean;
}

const TotalRow = ({ label, value, tw, strong = false }: TotalRowProps) => (
  <View style={[tw("flex-row"), bottomLine]}>
    <Text style={[tw(strong ? "w-1/2 px-1.5 py-1 font-bold" : "w-1/2 px-1.5 py-1"), rightLine]}>{label}:</Text>
    <Text style={tw(strong ? "w-1/2 px-1.5 py-1 text-right font-bold" : "w-1/2 px-1.5 py-1 text-right")}>{value}</Text>
  </View>
);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);

export default ClassicPdf;
