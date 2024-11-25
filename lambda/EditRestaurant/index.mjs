import { connect } from "../opt/lib/connect.mjs";
import { verify } from "../opt/lib/verify.mjs";

export const handler = async (event) => {
  const { decoded, error: authError } = await verify(event.jwt);
  if (authError) return {
    statusCode: 401,
    error: authError
  }

  if (decoded.isAdmin) return {
    statusCode: 401,
    error: "Administrators cannot modify restaurant information"
  }

  // create database connection
  const { pool, error: dbError } = await connect();
  if (dbError) return {
    statusCode: 500,
    error: "Unable to create database connection"
  };

  // Check if restaurant name already exists
  const checkRestaurantNameExists = async (name) => {
    try {
      const [rows] = await pool.execute("SELECT restaurantID FROM restaurants WHERE name = ?", [name]);
      if (rows[0] && rows[0].restaurantID != decoded.restaurantID ) return true;
      return false;
    } catch (error) {
      throw error;
    }
  };

  const isValidTime = (time) => {
    const timeNum = Number(time);
    return timeNum >= 0 && timeNum <= 2400;
  };

  // Function to edit restaurant information
  console.log(decoded.restaurantID);
  const editRestaurant = async (name, address, open, close) => {
    try {
      const [result, _fields] = await pool.execute(
        "UPDATE restaurants SET name = ?, address = ?, openingTime = ?, closingTime = ? WHERE restaurantID = ?",
        [name, address, open, close, decoded.restaurantID]
      );
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Validate restaurant name, open time, close time
  try {
    const nameExists = await checkRestaurantNameExists(event.name);
    if (nameExists) {
      pool.end();
      return {
        statusCode: 400,
        error: "Restaurant name already exists"
      };
    }

    if (!isValidTime(event.openingTime)) {
      pool.end();
      return {
        statusCode: 400,
        error: "Invalid open time"
      };
    }

    if (!isValidTime(event.closingTime)) {
      pool.end();
      return {
        statusCode: 400,
        error: "Invalid close time"
      };
    }

    if (event.openingTime >= event.closingTime) {
      pool.end();
      return {
        statusCode: 400,
        error: "Open time must be earlier than close time"
      };
    }

    // Attempt to update the restaurant
    const rest_result = await editRestaurant(event.name, event.address, event.openingTime, event.closingTime);

    const response = {
      statusCode: 200,
      result: {
        name: event.name,
        address: event.address,
        open: event.openingTime,
        close: event.closingTime
      }
    };

    await pool.end();
    return response;

  } catch (error) {
    await pool.end();
    return {
      statusCode: 500,
      error
    };
  }
};