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

  const formatDate = (date) => {
    const [month, day, year] = date.split('-');
    return `${year}-${month}-${day}`;
  };

  const timeToHour = (timeStr) => {
    return parseInt(timeStr, 10);
  };

  //find all tables w/ restaurant ID
  const getTables = async (restaurantID) => {
    const [rows] = await pool.query(
      "SELECT * FROM tables WHERE restaurantID = ?",
      [restaurantID]
    );
    if (rows.length === 0){
      return null;
    }
    return rows;
  }
    
  //get day id using date
  const getDayID = async (restaurantID, date) => {
    const formattedDate = formatDate(date);
    const [rows] = await pool.query(
      "SELECT dayID FROM days WHERE restaurantID = ? AND date = ?",
      [restaurantID, formattedDate]
    );
    if (rows.length === 0) {
      return null;  
    }
    return rows[0].dayID;  
  };

 
  const getReservations = async (dayID, tableIDs) => {
    const [rows] = await pool.query(
      "SELECT * FROM reservations WHERE tableID IN (?) AND dayID = ?",
      [tableIDs, dayID]
    );
    return rows;
  };

  const getTableIDs = async (restaurantID) => {
    const [rows] = await pool.query(
      "SELECT tableID FROM tables WHERE restaurantID = ?",
      [restaurantID]
    );
    if (rows.length === 0) {
      return null;
    }
    return rows.map(row => row.tableID); 
  };

  const getTotalCustomers = async (tableID, dayID) => {
    const [rows] = await pool.query(
      "SELECT SUM(customerCount) AS totalCustomers FROM reservations WHERE tableID IN (?) AND dayID = ?",
      [tableID, dayID]
    );
    if (rows.length === 0 || rows[0].totalCustomers === null) {
      return 0; 
    }
    return rows[0].totalCustomers;
  };

  const getTotalSeats = async (restaurantID) => {
    const [rows] = await pool.query(
      "SELECT SUM(seats) AS totalSeats FROM tables WHERE restaurantID = ?",
      [restaurantID]
    );
    if (rows.length === 0 || rows[0].totalSeats === null) {
      return 0;  
    }
    return rows[0].totalSeats;
  }

  const getOpenTime = async (restaurantID) => {
    const [rows] = await pool.query(
      "SELECT openingTime FROM restaurants WHERE restaurantID = ?",
      [restaurantID]
    );
    if (rows.length === 0) {
      return null;  
    }
    return timeToHour(rows[0].openingTime);  // Convert opening time to an integer hour
  };
  
  const getCloseTime = async (restaurantID) => {
    const [rows] = await pool.query(
      "SELECT closingTime FROM restaurants WHERE restaurantID = ?",
      [restaurantID]
    );
    if (rows.length === 0) {
      return null;  
    }
    return timeToHour(rows[0].closingTime);  // Convert closing time to an integer hour
  };

  const reviewDaysAvailability = async (date) => {
    //find restaurant
    const restaurantID = decoded.restaurantID;

    const dayID = await getDayID(restaurantID, date);
    if (!dayID) {
      return {
        statusCode: 400,
        error: "No reservations found for this day"
      };
    }

    const tables = await getTables(restaurantID);
    if (!tables) {
      return {
        statusCode: 404,
        error: "No tables found for this restaurant"
      };
    }

    const tableIDs = await getTableIDs(restaurantID);
    const reservations = await getReservations(dayID, tableIDs);

    const totalCustomers = await getTotalCustomers(tableIDs, dayID);
    const totalSeats = await getTotalSeats(restaurantID);
    const openingTime = await getOpenTime(restaurantID);
    const closingTime = await getCloseTime(restaurantID);

    const utilReport = totalCustomers/(totalSeats*(closingTime - openingTime));
    

    return {
      statusCode: 200,
      response: {
        tables, 
        reservations,
        utilReport
      }
    };
  };

  const result = await reviewDaysAvailability(event.date);
  return result;
};



