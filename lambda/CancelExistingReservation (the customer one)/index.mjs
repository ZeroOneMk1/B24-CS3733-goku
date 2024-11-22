import { connect } from "../opt/lib/connect.mjs";

export const handler = async (event) => {

    // create database connection
    const { pool, error: dbError } = await connect();
    if (dbError) return {
        statusCode: 500,
        error: "Unable to create database connection"
    };

    try {

        const requestedReservationCode = event.confirmation;
        const requestedReservationEmail = event.email;
        // get information about reservation
        let infoquery = `SELECT * FROM reservations WHERE confirmationCode = ? AND email = ?`;
        let [reservation_info, infoerror] = await pool.query(infoquery, [requestedReservationCode, requestedReservationEmail]);
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
        restaurantID = restaurantID[0].restaurantID;
        let [restaurant_name, nameerror] = await pool.query(`SELECT name FROM restaurants WHERE restaurantID = ?`, [restaurantID]);
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
        let formattedDate = reservationDate.toISOString().split('T')[0];
        return {
            statusCode: 200,
            body: {
                name: "We don't store this information yet",
                email: email,
                restaurant: restaurant_name,
                date: formattedDate,
                time: time,
            }
        }
    } catch (error) {
        return {
            statusCode: 500,
            error: "Internal server error"
        };
    }
};
