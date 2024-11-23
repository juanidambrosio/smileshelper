const convertToMoney = (miles, taxPrice, milePrice, dolarPrice, moneyPrice) => {
  const arsPrice = parseFloat(
    parseInt(miles) * parseFloat(milePrice) +
      parseInt(taxPrice) +
      parseFloat(moneyPrice)
  );
  const usdPrice = arsPrice / parseInt(dolarPrice);
  return { arsPrice: arsPrice.toFixed(2), usdPrice: usdPrice.toFixed(2) };
};

module.exports = { convertToMoney };
