import axios from "axios";

export const validateAddress = async (postcode) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${postcode},UK&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const { data } = await axios.get(url);

    if (!data.results.length) return null;

    return {
      formatted: data.results[0].formatted_address,
      lat: data.results[0].geometry.location.lat,
      lng: data.results[0].geometry.location.lng,
    };
  } catch (err) {
    console.error("Address validation failed:", err.message);
    return null;
  }
};
