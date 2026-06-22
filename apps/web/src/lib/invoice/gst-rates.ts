interface GstRates {
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

function getGstRatesForStateCodes(companyStateCode: string, billingStateCode: string): GstRates {
  const companyCode = companyStateCode.trim();
  const billingCode = billingStateCode.trim();

  if (companyCode && billingCode && companyCode !== billingCode) {
    return {
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 18,
    };
  }

  return {
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 0,
  };
}

export { getGstRatesForStateCodes };
export type { GstRates };
