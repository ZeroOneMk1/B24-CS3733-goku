import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { connect } from "../opt/lib/connect.mjs";

export const handler = async (event) => {
  let pool;

  try {
    const { pool, error: dbError } = await connect();
    if (dbError) return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unable to create database connection" })
    };

    const generateReservationDetails = () => {
      const reservationID = crypto.randomUUID(); // Generate UUID for reservationID
      const confirmationCode = Math.floor(100000 + Math.random() * 900000); // Random confirmation code
      return { reservationID, confirmationCode };
    };

    const getRestaurantID = async (restaurantName) => {
      const [rows] = await pool.query(
        "SELECT restaurantID FROM restaurants WHERE name = ?",
        [restaurantName]
      );
      if (rows.length === 0) {
        throw new Error("Restaurant not found");
      }
      return rows[0].restaurantID;
    };

    const isRestaurantOpen = async (restaurantID, date) => {
      const [rows] = await pool.query(
        "SELECT * FROM days WHERE restaurantID = ? AND date = ?",
        [restaurantID, date]
      );
      if (rows.length === 0) {
        return true;  // Restaurant is open if no record exists for that date
      }
      return rows[0].isOpen === 1;  // Restaurant is open if isOpen is 1
    };

    const checkTableAvailability = async (restaurantID, dayID, customerCount, time) => {
      const [rows] = await pool.query(
        "SELECT * FROM tables WHERE restaurantID = ? AND seats >= ? AND number NOT IN (SELECT tableID FROM reservations WHERE restaurantID = ? AND dayID = ? AND time = ?)",
        [restaurantID, customerCount, restaurantID, dayID, time]
      );
      return rows.length > 0 ? rows[0].number : null;
    };

    const createNewDayIfNeeded = async (restaurantID, date) => {
      const [rows] = await pool.query(
        "SELECT * FROM days WHERE restaurantID = ? AND date = ?",
        [restaurantID, date]
      );
      if (rows.length === 0) {
        const dayID = crypto.randomUUID();  // Generate a new dayID (UUID)
        await pool.query(
          "INSERT INTO days (dayID, date, isOpen, restaurantID) VALUES (?, ?, ?, ?)",
          [dayID, date, 1, restaurantID]  // Mark the new day as open by default
        );
        return dayID;
      }
      return rows[0].dayID;
    };

    const formatDate = (date) => {
      const [month, day, year] = date.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; // Convert to YYYY-MM-DD format
    };

    const makeReservation = async (name, email, restaurantName, date, customerCount) => {
      if (!restaurantName) {
        throw new Error("Restaurant name is required.");
      }

      const restaurantID = await getRestaurantID(restaurantName);  // Get restaurantID based on restaurant name

      const formattedDate = formatDate(date);

      const open = await isRestaurantOpen(restaurantID, formattedDate);
      if (!open) {
        throw new Error("The restaurant is closed on the requested day.");
      }

      const { reservationID, confirmationCode } = generateReservationDetails();

      const dayID = await createNewDayIfNeeded(restaurantID, formattedDate);

      const availableTable = await checkTableAvailability(restaurantID, dayID, customerCount, time);
      if (!availableTable) {
        throw new Error("No available table for the specified customer count.");
      }

      // Ensure customerCount is a number
      const customerCountNumber = Number(customerCount);
      if (isNaN(customerCountNumber)) {
        throw new Error("Customer count must be a valid number.");
      }

      // Insert reservation, fixing the query parameters
      const [result] = await pool.query(
        "INSERT INTO reservations (reservationID, customerCount, dayID, tableID, email, confirmationCode) VALUES (?, ?, ?, ?, ?, ?)",
        [reservationID, customerCountNumber, dayID, availableTable, email, confirmationCode]
      );

      return {
        reservationID,
        confirmationCode,
        tableID: availableTable,
        customerCount: customerCountNumber,
        date: formattedDate,
        email,
        dayID
      };
    };

    const reservationDetails = await makeReservation(
      event.name,
      event.email,
      event.restaurant,  // Pass the restaurant name from the input
      event.date,
      event.customerCount
    );

    return {
      statusCode: 200,
      body: JSON.stringify(reservationDetails)
    };

  } catch (error) {
    console.error('Error:', error);
    const statusCode = error.message.includes("No available table") || error.message.includes("The restaurant is closed") ? 400 : 500;
    return {
      statusCode,
      body: JSON.stringify({
        error: "An unexpected error occurred.",
        details: error.message
      })
    };
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};
