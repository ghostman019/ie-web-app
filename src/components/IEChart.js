import React, { useEffect } from 'react';

const IEChart = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://files.coinmarketcap.com/static/widget/currency.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="coinmarketcap-currency-widget" data-currencyid="1" data-base="USD" data-secondary="" data-ticker="true" data-rank="true" data-marketcap="true" data-volume="true" data-statsticker="true" style={{ height: '500px', width: '100%' }}></div>
  );
};

export default IEChart;