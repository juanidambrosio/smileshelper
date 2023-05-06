const convertToMoney = (miles, taxPrice, milePrice, dolarPrice, moneyPrice) => {
  const isSmilesAndMoneyPrice = moneyPrice !== "undefined";
  const realMoneyPrice = isSmilesAndMoneyPrice ? parseFloat(moneyPrice) : 0;
  const arsPrice = parseFloat(
    parseInt(miles) * parseFloat(milePrice) +
      parseInt(taxPrice) +
      realMoneyPrice
  );
  const usdPrice = arsPrice / parseInt(dolarPrice);
  return { arsPrice: arsPrice.toFixed(2), usdPrice: usdPrice.toFixed(2) };
};

module.exports = { convertToMoney };
