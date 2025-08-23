const axios = require('axios');

/**
 * Validate a UK address (basic required fields) and geocode using postcodes.io
 * Returns the address object with a GeoJSON Point coordinates property (lng, lat)
 */
exports.validateAndGeocodeUK = async (address) => {
  if (!address || !address.line1 || !address.city || !address.postcode) {
    throw new Error('Invalid address: line1, city, postcode are required');
  }
  const pc = String(address.postcode).trim();
  const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`;
  const { data } = await axios.get(url);
  if (data.status !== 200 || !data.result) {
    throw new Error('Invalid UK postcode');
  }
  const { longitude, latitude } = data.result;
  return {
    ...address,
    country: address.country || 'GB',
    coordinates: { type: 'Point', coordinates: [longitude, latitude] }
  };
};