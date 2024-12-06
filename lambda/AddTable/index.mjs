import { connect } from "../opt/lib/connect.mjs";
import { verify } from "../opt/lib/verify.mjs";
import { randomUUID } from "crypto";

export const handler = async (event) => {
  // verify well-formed request
  if (!event.seats || typeof event.seats !== "number") {
    return {
      statusCode: 400,
      error: "Number of seats is invalid"
    }
  }

  if (event.seats > 8) {
    return {
      statusCode: 400,
      error: `Number of seats ${event.seats} is larger than the max of 8 seats`
    }
  }

  const { decoded, error: authError } = await verify(event.jwt);
  if (authError) return {
    statusCode: 401,
    error: "Unauthorized"
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

  let nextNumber;
  try {
    // find next table
    const [numTableResults, _numTableFields] = await pool.execute(
        "select max(number) as NumTables from tables where restaurantID = ?", [decoded.restaurantID]);
    nextNumber = (numTableResults[0].NumTables == null) ? 1 : numTableResults[0].NumTables + 1;
  } catch (error) {
    pool.end();
    return {
      statusCode: 500,
      error: "Internal server error: unable to query existing tables"
    };
  }

  try {
    const [addTableResults, _addTableFields] = await pool.execute("insert into tables values(?, ?, ?, ?)", [
      randomUUID(), nextNumber, event.seats, decoded.restaurantID]);
    
    const [selectTablesResults, _selectTablesFields] = await pool.execute(
      "select number, seats from tables where restaurantID = ? order by number", [decoded.restaurantID]);

    pool.end();
    return {
      statusCode: 200,
      body: JSON.stringify({tables: selectTablesResults}),
    };
  } catch (error) {
    if (error.errno == 1452) {
      pool.end();
      return {
        statusCode: 400,
        error: "Restaurant does not exist"
      };
    }

    pool.end();
    console.log(error);
    return {
      statusCode: 500,
      error: "Internal server error: unable to add table"
    };
  }
};