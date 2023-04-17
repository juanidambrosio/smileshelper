const convertToMoney = (miles, taxPrice, milePrice, dolarPrice) => {
  const arsPrice = parseFloat(
    parseInt(miles) * parseFloat(milePrice) + parseInt(taxPrice)
  );
  const usdPrice = arsPrice / dolarPrice;
  return { arsPrice: arsPrice.toFixed(2), usdPrice: usdPrice.toFixed(2) };
};

module.exports = { convertToMoney };
