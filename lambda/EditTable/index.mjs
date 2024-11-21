import { connect } from "../opt/lib/connect.mjs"

export const handler = async (event) => {
  // create database connection
  const { pool, error: dbError } = await connect();
  if (dbError) return {
    statusCode: 500,
    error: "Unable to create database connection"
  };

  // hardcode restaurantID
  const restaurantID = 'fafd52f9-9529-4eb2-be00-8dbc580221af'; //correct
  // const restaurantID = 'fafd52f9-9529-4eb2-be00-8dbc580221ad'; // incorrect

  let nextNumber;

  try {
    // insert new table
    const [editTableResults, _editTableFields] = await pool.execute("update tables set seats = ? where number = ? and restaurantID = ?", [
      event.seats, event.number, restaurantID
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
      "select number, seats from tables where restaurantID = ? ", [restaurantID]);
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