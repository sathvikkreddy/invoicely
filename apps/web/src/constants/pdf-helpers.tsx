import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import Decimal from "decimal.js";

export interface InvoiceItemTotals {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  total: number;
}

export interface InvoiceTotals {
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  adjustmentTotal: number;
  total: number;
  itemTotals: InvoiceItemTotals[];
}

const toNumber = (value: Decimal) => value.toDecimalPlaces(2).toNumber();

export const getSubTotalValue = (data: ZodCreateInvoiceSchema) => {
  return getInvoiceTotals(data).subtotal;
};

export const getInvoiceTotals = (data: ZodCreateInvoiceSchema): InvoiceTotals => {
  const itemTotals = data.items.map((item) => {
    const taxableAmount = new Decimal(item.quantity).mul(item.unitPrice);
    const cgstAmount = taxableAmount.mul(item.cgstRate ?? 0).div(100);
    const sgstAmount = taxableAmount.mul(item.sgstRate ?? 0).div(100);
    const igstAmount = taxableAmount.mul(item.igstRate ?? 0).div(100);
    const totalTax = cgstAmount.plus(sgstAmount).plus(igstAmount);

    return {
      taxableAmount: toNumber(taxableAmount),
      cgstAmount: toNumber(cgstAmount),
      sgstAmount: toNumber(sgstAmount),
      igstAmount: toNumber(igstAmount),
      totalTax: toNumber(totalTax),
      total: toNumber(taxableAmount.plus(totalTax)),
    };
  });

  const subtotal = itemTotals.reduce((acc, item) => new Decimal(acc).plus(item.taxableAmount).toNumber(), 0);
  const cgstTotal = itemTotals.reduce((acc, item) => new Decimal(acc).plus(item.cgstAmount).toNumber(), 0);
  const sgstTotal = itemTotals.reduce((acc, item) => new Decimal(acc).plus(item.sgstAmount).toNumber(), 0);
  const igstTotal = itemTotals.reduce((acc, item) => new Decimal(acc).plus(item.igstAmount).toNumber(), 0);

  const billingRates = data.invoiceDetails.billingDetails;

  // Calculate the total value based of fixed/percentage billing rates also value can be positive or negative
  let adjustmentTotal = new Decimal(0);

  billingRates.forEach((rate) => {
    if (rate.type === "fixed") {
      // Add or subtract the fixed amount directly
      adjustmentTotal = adjustmentTotal.plus(rate.value);
    } else if (rate.type === "percentage") {
      // Calculate percentage of subtotal and add/subtract
      const percentageValue = new Decimal(subtotal).mul(rate.value).div(100);
      adjustmentTotal = adjustmentTotal.plus(percentageValue);
    }
  });

  const taxTotal = new Decimal(cgstTotal).plus(sgstTotal).plus(igstTotal);
  const total = new Decimal(subtotal).plus(taxTotal).plus(adjustmentTotal);

  return {
    subtotal: toNumber(new Decimal(subtotal)),
    cgstTotal: toNumber(new Decimal(cgstTotal)),
    sgstTotal: toNumber(new Decimal(sgstTotal)),
    igstTotal: toNumber(new Decimal(igstTotal)),
    taxTotal: toNumber(taxTotal),
    adjustmentTotal: toNumber(adjustmentTotal),
    total: toNumber(total),
    itemTotals,
  };
};

export const getTotalValue = (data: ZodCreateInvoiceSchema) => {
  return getInvoiceTotals(data).total;
};
