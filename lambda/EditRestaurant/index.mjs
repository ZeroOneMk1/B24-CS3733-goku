import { connect } from "../opt/lib/connect.mjs";
import { verify } from "../opt/lib/verify.mjs";
import mysql from 'mysql2/promise';

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
      const [rows] = await pool.execute("SELECT * FROM restaurants WHERE name = ?", [name]);
      return rows.length > 0; // true if name exists
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
      return {
        statusCode: 400,
        error: "Restaurant name already exists"
      };
    }

    if (isValidTime(event.open)) {
      return {
        statusCode: 400,
        error: "Invalid open time"
      };
    }

    if (isValidTime(event.close)) {
      return {
        statusCode: 400,
        error: "Invalid close time"
      };
    }

    if (event.open >= event.close) {
      return {
        statusCode: 400,
        error: "Open time must be earlier than close time"
      };
    }

    // Attempt to update the restaurant
    const rest_result = await editRestaurant(event.name, event.address, event.opentime, event.closetime);

    const response = {
      statusCode: 200,
      result: {
        name: event.name,
        address: event.address,
        open: event.opentime,
        close: event.closetime
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