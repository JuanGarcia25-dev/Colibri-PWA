const DEFAULT_USD_MXN_RATE = 17;

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

module.exports.getUsdMxnRate = () => {
  const parsed = Number(process.env.USD_MXN_RATE);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_USD_MXN_RATE;
};

module.exports.buildPaymentSummaryFromMxn = (amountMxn) => {
  const rate = module.exports.getUsdMxnRate();
  const safeMxn = Number.isFinite(Number(amountMxn)) ? Number(amountMxn) : 0;
  const amountUsd = round2(safeMxn / rate);

  return {
    method: "cash",
    currency: "MXN",
    amountMxn: safeMxn,
    amountUsd,
    fxRate: rate,
    fxUpdatedAt: new Date(),
    status: "pending",
  };
};

