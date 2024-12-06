import { connect } from "../opt/lib/connect.mjs";
import { verify } from "../opt/lib/verify.mjs";

export const handler = async (event) => {
  const { decoded, error: authError } = await verify(event.jwt);
  if(authError) {
    console.log(authError);
  }
  if (authError || !decoded.isAdmin) return {
    statusCode: 401,
    error: "User not authenticated"
  }

  // create database connection
  const { pool, error: dbError } = await connect();
  if (dbError) return {
    statusCode: 500,
    error: "Unable to create database connection"
  };

  const DateJSON2JS = (date) => {
    const [month, day, year] = date.split('-');
    return new Date(year, month, day);
  }

  const DateJS2SQL = (date) => {
    return "" + date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();
  };

  const DateSQL2JS = (date) => {
    const [year, month, day] = date.split('-');
    return new Date(year, month - 1, day);
  }

  const DateJS2JSON = (date) => {
    return `${date.getMonth()}-${date.getDate()}-${date.getFullYear()}`;
  }

  const getRestaurantInfo = async (restaurantID) => {
    const [rows] = await pool.query(
      "SELECT * FROM restaurants WHERE restaurantID = ?",
      [restaurantID]
    );
    return rows;
  }

  const getTables = async (restaurantID) => {
    const [rows] = await pool.query(
      "SELECT * FROM tables WHERE restaurantID = ?",
      [restaurantID]
    );
    return rows;
  }

  const getDay = async (restaurantID, sqlDate) => {
    const [rows] = await pool.query(
      "SELECT * FROM days WHERE restaurantID = ? and date = ? AND isOpen = 1",
      [restaurantID, sqlDate]
    );
    return rows;
  }

  const getDaysReservations = async (restaurantID, sqlDate) => {
    const dayRows = await getDay(restaurantID, sqlDate);
    console.log(dayRows);
    if(dayRows.length > 0) {
      const [rows] = await pool.query(
        "SELECT * FROM reservations WHERE dayID = ?",
        [dayRows[0].dayID]
      );
      console.log(rows);
      return rows;
    }
    return [];
  }

  const getDaysSeats = async (reservations) => {
    let numSeats = 0;
    for(let reservation of reservations) {
      numSeats += reservation.customerCount;
    }
    return numSeats;
  }

  let response = {};
  let restaurantInfo = await getRestaurantInfo(event.restaurantID);
  if(restaurantInfo.length <= 0) {
    response = {
      statusCode: 400,
      error: "Restaurant doesn't exist"
    }
    return response;
  } else {
    restaurantInfo = restaurantInfo[0];
  }
  let startDayJS = new Date();
  let endDayJS = new Date();
  try {
    startDayJS = DateJSON2JS(event.startDay);
    endDayJS = DateJSON2JS(event.endDay);
  } catch {
    response = {
      statusCode: 400,
      error: "Date is not real"
    };
    return response;
  }
  if(startDayJS > endDayJS) {
    response = {
      statusCode: 400,
      error: "End date is earlier than start date"
    }
    return response;
  }
  const oneDay = 24 * 60 * 60 * 1000;
  const daysBetween = (endDayJS - startDayJS)/oneDay;
  if(daysBetween >= 7) {
    response = {
      statusCode: 400,
      error: "Date range is greater than 7 days"
    }
    return response;
  }
  const tables = await getTables(event.restaurantID);
  const numTables = tables.length;
  let numSeats = 0;
  for(let table of tables) {
    numSeats += table.seats;
  }
  const operatingHours = (restaurantInfo?.closingTime ?? 0) - (restaurantInfo?.openingTime ?? 0);
  const dailyTables = numTables * operatingHours;
  const dailySeats = numSeats * operatingHours;    
  const reportArray = [];
  for(let i = 0; i <= daysBetween; i++) {
    const iDay = new Date(startDayJS);
    iDay.setDate(iDay.getDate() + i);
    console.log(DateJS2SQL(iDay));
    const reservations = await getDaysReservations(event.restaurantID, DateJS2SQL(iDay));
    console.log(reservations);
    reportArray[i] = {}
    if(numTables == 0 || operatingHours <= 0) {
      reportArray[i][DateJS2JSON(iDay)] = {
        utilization: 0,
        availbility: 0
      }
    } else {
      console.log('seats' + (dailySeats));
      console.log('dayseats' + await getDaysSeats(reservations));
      console.log('equation' + ((await getDaysSeats(reservations)) / dailySeats));
      reportArray[i][DateJS2JSON(iDay)] = {
        utilization: (await getDaysSeats(reservations) / dailySeats),
        availability: (1.0 - (reservations.length / dailyTables))
      }
    }
  }
  response = {
    report: reportArray,
  };
  return response;
};
