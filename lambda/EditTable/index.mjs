import { connect } from "../opt/lib/connect.mjs";
import { verify } from "../opt/lib/verify.mjs";

export const handler = async (event) => {
  const { decoded, error: authError } = verify(event.jwt);
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
    // insert new table
    const [editTableResults, _editTableFields] = await pool.execute("update tables set seats = ? where number = ? and restaurantID = ?", [
      event.seats, event.number, decoded.restaurantID
    ]);

    if (editTableResults.affectedRows == 0) {
      return {
        statusCode: 400,
        error: "Invalid restaurant or table number"
      }
    }

    if (editTableResults.changedRows == 0) {
      return {
        statusCode: 400,
        error: "Number of seats is the same as existing value"
      }
    }

    // select all seats and return to users
    const [selectTablesResults, _selectTablesFields] = await pool.execute(
      "select number, seats from tables where restaurantID = ? ", [decoded.restaurantID]);
    return {
      statusCode: 200,
      body: JSON.stringify({ tables: selectTablesResults }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      error: "Internal server error: unable to edit table"
    };
  }
};