import { connect } from "../opt/lib/connect.mjs";
import { verify } from "../opt/lib/verify.mjs";

export const handler = async (event) => {
  if (!event.number) return {
    statusCode: 400,
    error: "Table number not provided"
  }

  if (!event.seats) return {
    statusCode: 400,
    error: "Number of seats not provided"
  }

  if (event.seats < 1 || event.seats > 8) return {
    statusCode: 400,
    error: "Invalid number of seats"
  }

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

  let nextNumber;
  try {
    // insert new table
    const [editTableResults, _editTableFields] = await pool.execute("update tables set seats = ? where number = ? and restaurantID = ?", [
      event.seats, event.number, decoded.restaurantID
    ]);

    if (editTableResults.affectedRows == 0) {
      pool.end();
      return {
        statusCode: 400,
        error: "Invalid restaurant or table number"
      }
    }

    if (editTableResults.changedRows == 0) {
      pool.end();
      return {
        statusCode: 400,
        error: "Number of seats is the same as existing value"
      }
    }

    // select all seats and return to users
    const [selectTablesResults, _selectTablesFields] = await pool.execute(
      "select number, seats from tables where restaurantID = ? order by number", [decoded.restaurantID]);
    pool.end();
    return {
      statusCode: 200,
      body: JSON.stringify({ tables: selectTablesResults }),
    };
  } catch (error) {
    pool.end();
    return {
      statusCode: 500,
      error: "Internal server error: unable to edit table"
    };
  }
};