import { verify } from '../opt/lib/verify.mjs';
import { connect } from '../opt/lib/connect.mjs';

export const handler = async (event) => {
	const { decoded, error: authError } = await verify(event.jwt);
	if (authError) return {
		statusCode: 401,
		error: "Unauthorized"
	}
  
	if (decoded.isAdmin && !event.restaurantID) return {
		statusCode: 400,
		error: "Restaurant ID not provided with administrator request"
	}
  
	// create database connection
	const { pool, error: dbError } = await connect();
	if (dbError) return {
		statusCode: 500,
		error: "Unable to create database connection"
	};

	try {
		const restaurantID = (event.restaurantID) ? event.restaurantID : decoded.restaurantID;
		const [ updateResult, _updateFields] = await pool.query(
			"update restaurants set isActive = 1 where restaurantID = ?", [restaurantID]);
		
		if (updateResult.changedRows == 0) {
			pool.end();
			return {
				statusCode: 400,
				error: "Invalid restaurant ID"
			}
		}
		
		const [ selectResult, _selectFields] = await pool.query(
			"select name, address, isActive, openingTime, closingTime from restaurants where restaurantID = ?", [restaurantID]);
			
		pool.end();
		return {
			statusCode: 200,
			body: JSON.stringify({ restaurantInfo: selectResult[0] })
		};
	} catch (error) {
    	pool.end();
		return {
			statusCode: 400,
			error: "Internal server error: unable to delete restaurant"
		};
	}
};