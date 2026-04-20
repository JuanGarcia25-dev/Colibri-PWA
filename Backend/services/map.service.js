const axios = require("axios");
const riderModel = require("../models/rider.model");

module.exports.getAddressCoordinate = async (address) => {
  const apiKey = process.env.GOOGLE_MAPS_API;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      const location = response.data.results[0].geometry.location;
      return {
        ltd: location.lat,
        lng: location.lng,
      };
    } else {
      throw new Error("Unable to fetch coordinates");
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports.getAddressFromCoordinates = async (lat, lng) => {
  const apiKey = process.env.GOOGLE_MAPS_API;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK" && response.data.results.length > 0) {
      const results = response.data.results;

      // Prefer results that represent a street address/route/premise
      const preferredTypes = [
        "street_address",
        "route",
        "premise",
        "subpremise",
        "neighborhood",
      ];

      let chosen = results.find((r) => r.types && r.types.some((t) => preferredTypes.includes(t)));

      // If none matches preferred types, pick the first result that is not just a plus_code fallback
      if (!chosen) {
        chosen = results.find((r) => !(r.plus_code && r.types && r.types.includes("plus_code"))) || results[0];
      }

      // Build a cleaner human-readable address from address_components when possible
      const comps = chosen.address_components || [];
      const getComp = (types) => {
        const c = comps.find((cmp) => types.some((t) => cmp.types.includes(t)));
        return c ? c.long_name : null;
      };

      const street = getComp(["route"]) || getComp(["street_address"]);
      const number = getComp(["street_number"]);
      const neighborhood = getComp(["neighborhood", "sublocality_level_1", "sublocality"]);
      const city = getComp(["locality"]) || getComp(["administrative_area_level_2"]);
      const state = getComp(["administrative_area_level_1"]);
      const country = getComp(["country"]);

      const parts = [];
      if (street) parts.push(number ? `${street} ${number}` : street);
      if (neighborhood) parts.push(neighborhood);
      if (city) parts.push(city);
      if (state) parts.push(state);
      if (country) parts.push(country);

      const formatted = parts.length ? parts.join(', ') : chosen.formatted_address;
      return formatted;
    } else {
      throw new Error("Unable to fetch address");
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports.getDistanceTime = async (origin, destination) => {
  if (!origin || !destination) {
    throw new Error("Origin and destination are required");
  }
  const apiKey = process.env.GOOGLE_MAPS_API;

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
    origin
  )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      if (response.data.rows[0].elements[0].status === "ZERO_RESULTS") {
        throw new Error("No routes found");
      }

      return response.data.rows[0].elements[0];
    } else {
      throw new Error("Unable to fetch distance and time");
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
  if (!input) {
    throw new Error("query is required");
  }

  const apiKey = process.env.GOOGLE_MAPS_API;
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      return response.data.predictions
        .map((prediction) => prediction.description)
        .filter((value) => value);
    } else {
      throw new Error("Unable to fetch suggestions");
    }
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};

module.exports.getRidersInTheRadius = async (ltd, lng, radius, vehicleType) => {
  // radius in km
  
  try {
    const riders = await riderModel.find({
      location: {
        $geoWithin: {
          $centerSphere: [[lng, ltd], radius / 6371],
        },
      },
      "vehicle.type": vehicleType,
    });
    return riders;
  } catch (error) {
    throw new Error("Error in getting rider in radius: " + error.message);
  }
};
