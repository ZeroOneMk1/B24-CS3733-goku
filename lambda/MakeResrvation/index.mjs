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
      const reservationID = crypto.randomUUID();
      const confirmationCode = Math.floor(100000 + Math.random() * 900000);
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

    const getDayID = async (restaurantID, date) => {
      const [rows] = await pool.query(
        "SELECT dayID FROM days WHERE restaurantID = ? AND date = ?",
        [restaurantID, date]
      );
      if (rows.length === 0) {
        return null;  
      }
      return rows[0].dayID;  
    };

    const isRestaurantOpen = async (restaurantID, date) => {
      const [rows] = await pool.query(
        "SELECT * FROM days WHERE restaurantID = ? AND date = ?",
        [restaurantID, date]
      );
      if (rows.length === 0) {
        return true;  //if no day entry exists assume open
      }
      return rows[0].isOpen === 1;  
    };

    const checkTableAvailability = async (restaurantID, dayID, customerCount, time, connection) => {
      const [rows] = await connection.query(
        "SELECT tableID, number, seats FROM tables WHERE restaurantID = ? AND seats >= ? AND tableID NOT IN (SELECT tableID FROM reservations WHERE restaurantID = ? AND dayID = ? AND time = ?)",
        [restaurantID, customerCount, restaurantID, dayID, time]
      );
    
      if (rows.length === 0) {
        return null; 
      }
    
      const availableTable = rows.sort((a, b) => (a.seats - customerCount) - (b.seats - customerCount))[0];

      if (availableTable) {
        console.log(`Available table found: Table number: ${availableTable.number}, tableID: ${availableTable.tableID}`);
        return availableTable.tableID;
      }
    
      return null;
    };
    


    const createNewDayIfNeeded = async (restaurantID, date) => {
      const [rows] = await pool.query(
        "SELECT dayID FROM days WHERE restaurantID = ? AND date = ?",
        [restaurantID, date]
      );
    
      if (rows.length === 0) {
        const dayID = crypto.randomUUID(); 
        console.log(`Creating new day entry for dayID: ${dayID} on date: ${date}`);
        await pool.query(
          "INSERT INTO days (dayID, date, isOpen, restaurantID) VALUES (?, ?, ?, ?)",
          [dayID, date, 1, restaurantID] 
        );
        return dayID;
      }
    
      return rows[0].dayID;
    };

    const formatDate = (date) => {
      try{
        const [month, day, year] = date.split('/');
        console.log(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } catch {
        console.log(date);
        return date;
      }
    };

    const timeToHour = (timeStr) => {
      return parseInt(timeStr, 10);  
    };

    const getOpenTime = async (restaurantID) => {
      const [rows] = await pool.query(
        "SELECT openingTime FROM restaurants WHERE restaurantID = ?",
        [restaurantID]
      );
      if (rows.length === 0) {
        return null;  
      }
      return timeToHour(rows[0].openingTime);  
    };
    
    const getCloseTime = async (restaurantID) => {
      const [rows] = await pool.query(
        "SELECT closingTime FROM restaurants WHERE restaurantID = ?",
        [restaurantID]
      );
      if (rows.length === 0) {
        return null;  
      }
      return timeToHour(rows[0].closingTime); 
    };

    //check that time must be less then closetime
    const validTime = (openingTime, closingTime, reservationTime) => {
      if (reservationTime >= openingTime && reservationTime < closingTime) {
        return true;
      }
      return false;  
    };

    const makeReservation = async (name, email, restaurantName, date, customerCount, time) => {
      const connection = await pool.getConnection();
      await connection.beginTransaction();  

      try {
        const restaurantID = await getRestaurantID(restaurantName, connection);
        const formattedDate = formatDate(date);
        const openingTime = await getOpenTime(restaurantID, connection);
        const closingTime = await getCloseTime(restaurantID, connection);

        const timeIsValid = validTime(openingTime, closingTime, time);
        if (!timeIsValid) {
          throw new Error("Invalid reservation time");
        }

        const open = await isRestaurantOpen(restaurantID, formattedDate, connection);
        if (!open) {
          throw new Error("The restaurant is closed on the requested day.");
        }

        const { reservationID, confirmationCode } = generateReservationDetails();
        let dayID = await getDayID(restaurantID, formattedDate, connection);
        if (!dayID) {
          dayID = await createNewDayIfNeeded(restaurantID, formattedDate, connection);
        }

        const availableTable = await checkTableAvailability(restaurantID, dayID, customerCount, time, connection);
        if (!availableTable) {
          throw new Error("No available table for the specified customer count.");
        }

        const customerCountNumber = Number(customerCount);
        if (isNaN(customerCountNumber)) {
          throw new Error("Customer count must be a valid number.");
        }

        await connection.query(
          "INSERT INTO reservations (reservationID, customerCount, dayID, tableID, email, confirmationCode, time) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [reservationID, customerCountNumber, dayID, availableTable, email, confirmationCode, time]
        );

        await connection.commit();  

        return {
          reservationID,
          confirmationCode,
          tableID: availableTable,
          customerCount: customerCountNumber,
          date: formattedDate,
          email,
          dayID
        };
      } catch (error) {
        await connection.rollback();  
        throw error;  
      } finally {
        connection.release();  
      }
    };

    const reservationDetails = await makeReservation(
      event.name,
      event.email,
      event.restaurant,
      event.date,
      event.customerCount,
      event.time
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