import { connect } from "../opt/lib/connect.mjs";
import { verify } from "../opt/lib/verify.mjs";

export const handler = async (event) => {
    const { decoded, error: authError } = await verify(event.jwt);
    if (authError) return {
        statusCode: 401,
        error: authError
    }

    if (decoded.type != "admin") return {
        statusCode: 401,
        error: "User not authenticated"
    }

    // create database connection
    const { pool, error: dbError } = await connect();
    if (dbError) return {
        statusCode: 500,
        error: "Unable to create database connection"
    };

    try {

        const requestedReservationCode = event.confirmation;
        // get information about reservation
        let infoquery = `SELECT * FROM reservations WHERE confirmationCode = ?`;
        let [reservation_info, infoerror] = await pool.query(infoquery, [requestedReservationCode]);
        if (infoerror) return {
            statusCode: 500,
            error: "Unable to access reservation"
        };
        if (reservation_info.length === 0) return {
            statusCode: 400,
            error: "Reservation does not exist"
        };
        let reservation = reservation_info[0];
        let tableID = reservation.tableID;
        let dayID = reservation.dayID;
        let customerCount = reservation.customerCount;
        let time = reservation.time;
        let email = reservation.email;
        let confirmationCode = reservation.confirmationCode;
        let [restaurantID, restauranterror] = await pool.query(`SELECT restaurantID FROM tables WHERE tableID = ?`, [tableID]);
        if (restauranterror) return {
            statusCode: 500,
            error: "Unable to access restaurant"
        };
        restaurantID = restaurantID[0].restaurantID;
        let [restaurant_name, nameerror] = await pool.query(`SELECT name FROM restaurants WHERE restaurantID = ?`, [restaurantID]);
        if (nameerror) return {
            statusCode: 500,
            error: "Unable to access restaurant"
        };
        restaurant_name = restaurant_name[0].name;
        let [day_date, dateerror] = await pool.query(`SELECT date FROM days WHERE dayID = ?`, [dayID]);


        let now = new Date();
        let reservationDate = new Date(day_date[0].date);
        if (now > reservationDate) {
            return {
                statusCode: 400,
                error: "Reservation date is in the past"
            };
        }
        // remove reservation from database
        let deletequery = `DELETE FROM reservations WHERE confirmationCode = ?`;
        let [result, deleteerror] = await pool.query(deletequery, [requestedReservationCode]);
        if (deleteerror) return {
            statusCode: 500,
            error: "Unable to cancel reservation"
        };

        return {
            statusCode: 200,
            body: JSON.stringify({
                name: "We don't store this information yet",
                email: email,
                restaurant: restaurant_name,
                date: day_date[0].date,
                time: time,
            })
        }
    } catch (error) {
        return {
            statusCode: 500,
            error: "Internal server error"
        };
    }
};
