import { connect } from "../opt/lib/connect.mjs";

export const handler = async (event) => {
    let datestring = event.filters.date;
    let requestedDate;
    if (datestring !== "") {
        try {
            requestedDate = new Date(datestring);
            // Format: YYYY-MM-DD
            // write a regex to match this format for any date.
            // 1-1-1 should also be a valid date for january 1st, 1 AD. NO ASSUMING LENGTH!
            const dateRegex = /^(\d+)-(\d+)-(\d+)$/;
            const [_, year, month, day] = datestring.match(dateRegex);

            if (month > 12 || month < 1 || day > 31 || day < 1) {
                throw new Error("Invalid date");
            } else if (month === 2 && day > 28) {
                throw new Error("Invalid date");
            } else if ([4, 6, 9, 11].includes(month) && day > 30) {
                throw new Error("Invalid date");
            }
        } catch (error) {
            return {
                statusCode: 400,
                error: "Invalid date"
            };
        }
        const now = new Date();
        if (now > requestedDate) {
            return {
                statusCode: 400,
                error: "Date is not in the future"
            };
        }
    }

    if (event.filters.guestCount < 1 || event.filters.guestCount > 8) {
        return {
            statusCode: 400,
            error: "Guest count is not in range 1-8"
        };
    }

    // create database connection
    const { pool, error: dbError } = await connect();
    if (dbError) return {
        statusCode: 500,
        error: "Unable to create database connection"
    };

    // try {
    let query;
    const filters = event.filters;
    const onlyShowAvailableRestaurants = filters.date !== "";
    /**
     * If a filter is null, do not include it in the query.
     * filters: {
     * “name" : “DAKA” | "",
     * “date" : “12-30-2024” | "",
     * “time" : “20:00” | "",
     * “guestCount" : “4”,
     * “onlyShowAvailableRestaurants" : “false” | “true” //  A restaurant is unavailable if there are no tables available for the requested date, time, and number of guests.
     * }
     * 
     * Restaurants table:
     * restaurantID	name	address	credentialID	isActive	openingTime	closingTime
     * Reservations table:
     * reservationID	dayID	tableID	customerCount	email	confirmationCode	time // A reservation for a table makes it unavailable for that day and time.
     * Tables table:
     * tableID	seats	restaurantID // A table is unavailable if it is reserved for the requested date and time. It is also unavailable if it has fewer seats than the requested number of guests.
     * Days table:
     * dayID	date	isOpen	restaurantID // A restaurant is unavailable if it is not open on the requested date.
     * 
     * return: {
     *  “restaurants" : [<RestaurantInfo>, ...] | []
     * }
     * where RestaurantInfo is:
     * {
     *  “name" : string,
     *  “address" : string,
     *  “isActive" : "true” | "false",
     *  “openingTime" : "7:00” | "7",
     *  “closingTime" : "19:00” | "19"
     * }
    */
    // write a ListRestaurants query using all the filters.
    let restaurantIDs;
    let restauranterror;
    // IF name is not null
    if (filters.name !== "") {
        // Find restaurantIDs that fit the name query using partial matching.
        query = `SELECT restaurantID FROM restaurants WHERE name LIKE ? AND isActive = true`; //  
        const searchTerm = `%${filters.name}%`;
        [restaurantIDs, restauranterror] = await pool.query(query, [searchTerm]);
        if (restaurantIDs.length === 0) return {
            statusCode: 200,
            restaurants: []
        };
    } else {
        // Find all restaurantIDs.
        query = `SELECT restaurantID FROM restaurants WHERE isActive = true`; //  
        [restaurantIDs, restauranterror] = await pool.query(query);
        if (restaurantIDs.length === 0) return {
            statusCode: 200,
            restaurants: []
        };
    }
    restaurantIDs = restaurantIDs.map(restaurant => restaurant.restaurantID);

    // remove restaurants that don't have tables big enough to support the group.
    query = `SELECT restaurantID FROM tables WHERE seats >= ? AND restaurantID IN (?)`;
    const [validTables, validTablesError] = await pool.query(query, [filters.guestCount, restaurantIDs]);
    const validRestaurantIDs = validTables.map(table => table.restaurantID);
    restaurantIDs = restaurantIDs.filter(restaurantID => validRestaurantIDs.includes(restaurantID));


    let finalRestaurantInfos;
    let restaurantError;
    if (onlyShowAvailableRestaurants) {
        let timeint;
        if (filters.time !== "") {
            // isolate the hour from the time string HH:MM to HH
            let timestring = filters.time.split(":")[0];
            // remove all non-numeric characters
            timestring = timestring.replace(/\D/g, "");
            timeint = parseInt(timestring);

            // remove restaurants that open after or close before the requested time
            query = `SELECT restaurantID FROM restaurants WHERE restaurantID IN (?) AND openingTime <= ? AND closingTime > ?`;
            const [validRestaurants, validRestaurantsError] = await pool.query(query, [restaurantIDs, timeint, timeint]);
            restaurantIDs = validRestaurants.map(restaurant => restaurant.restaurantID);
        }

        // Find the DayIDs for the requested date and restaurantIDs.
        let dayIDs;
        let dayerror;
        query = `SELECT dayID FROM days WHERE date = ? AND isOpen = true AND restaurantID IN (?)`;
        [dayIDs, dayerror] = await pool.query(query, [datestring, restaurantIDs]);
        dayIDs = dayIDs.map(day => day.dayID);
        if (dayIDs.length == 0) {
            query = `SELECT name, address, isActive, openingTime, closingTime FROM restaurants WHERE restaurantID IN (?)`;
            [finalRestaurantInfos, restaurantError] = await pool.query(query, [restaurantIDs]);
            return {
                statusCode: 200,
                restaurants: finalRestaurantInfos
            };
        }
        // Find ReservationIDs for the requested dayIDs at the given time.
        let reservationIDs;
        let reservationerror;
        if (filters.time !== "") {

            // remove restaurants that open after or close before the requested time
            query = `SELECT restaurantID FROM restaurants WHERE restaurantID IN (?) AND openingTime <= ? AND closingTime > ?`;
            const [validRestaurants, validRestaurantsError] = await pool.query(query, [restaurantIDs, timeint, timeint]);
            restaurantIDs = validRestaurants.map(restaurant => restaurant.restaurantID);

            query = `SELECT reservationID FROM reservations WHERE time = ? AND dayID IN (?)`;
            [reservationIDs, reservationerror] = await pool.query(query, [timeint, dayIDs]);
            if (reservationIDs.length === 0) {
                query = `SELECT name, address, isActive, openingTime, closingTime FROM restaurants WHERE restaurantID IN (?)`;
                [finalRestaurantInfos, restaurantError] = await pool.query(query, [restaurantIDs]);
                return {
                    statusCode: 200,
                    restaurants: finalRestaurantInfos
                };
            }
        } else {
            query = `SELECT reservationID FROM reservations WHERE dayID IN (?)`;
            [reservationIDs, reservationerror] =
                await pool.query(query, [dayIDs]);
            if (reservationIDs.length === 0) {
                query = `SELECT name, address, isActive, openingTime, closingTime FROM restaurants WHERE restaurantID IN (?)`;
                [finalRestaurantInfos, restaurantError] = await pool.query(query, [restaurantIDs]);
                return {
                    statusCode: 200,
                    restaurants: finalRestaurantInfos
                };
            }
        }
        reservationIDs = reservationIDs.map(reservationIDs => reservationIDs.reservationID);
        // Find TableIDs for the requested reservationIDs.
        query = `SELECT tableID FROM reservations WHERE reservationID IN (?)`;
        let [tableIDs, tableerror] = await pool.query(query, [reservationIDs]);
        tableIDs = tableIDs.map(tableIDs => tableIDs.tableID);
        // Now we have the tables that are in use at the requested date and time and restaurant.
        // We need to find the tables NOT included in this list, but INCLUDED in the restaurantIDs list.
        query = `SELECT tableID, seats, restaurantID FROM tables WHERE restaurantID IN (?)`;
        const [allTables, allTablesError] = await pool.query(query, [restaurantIDs]);
        // Filter out the tablesIDs that are in use. This depends on Time
        let availableTables;
        if (filters.time !== "") {
            availableTables = allTables.filter(table => !tableIDs.includes(table.tableID));
        }else{
            // If time is not specified, only tables that are booked for every time the restaurant is open are available
            // This will need more SQL queries
            for(table of allTables){
                // get the reservations for this table on the requested day
                query = `SELECT reservationID FROM reservations WHERE tableID = ? AND dayID IN (?)`;
                let [reservations, reservationsError] = await pool.query(query, [table.tableID, dayIDs]);
                // get the restaurant's opening and closing time
                query = `SELECT openingTime, closingTime FROM restaurants WHERE restaurantID = ?`;
                let [restaurantTimes, restaurantTimesError] = await pool.query(query, [table.restaurantID]);
                // check if the table is booked for every time the restaurant is open
                // ! This assumes that each reservation is 1 hour.
                if(reservations.length < restaurantTimes[0].closingTime - restaurantTimes[0].openingTime){
                    availableTables.push(table);
                }
            }
        }
        // Filter out the tables that are too small.
        availableTables = availableTables.filter(table => table.seats >= filters.guestCount);
        // Find the restaurantIDs these tables belong to.
        const availableRestaurantIDs = availableTables.map(table => table.restaurantID);
        // Find the restaurant information for these restaurantIDs.
        query = `SELECT name, address, isActive, openingTime, closingTime FROM restaurants WHERE restaurantID IN (?)`;
        [finalRestaurantInfos, restaurantError] = await pool.query(query, [availableRestaurantIDs]);
    } else {
        if (filters.time !== "") {
            // isolate the hour from the time string HH:MM to HH
            let timestring = filters.time.split(":")[0];
            // remove all non-numeric characters
            timestring = timestring.replace(/\D/g, "");
            let timeint = parseInt(timestring);
            // remove restaurants that open after or close before the requested time
            query = `SELECT restaurantID FROM restaurants WHERE restaurantID IN (?) AND openingTime <= ? AND closingTime > ?`;
            const [validRestaurants, validRestaurantsError] = await pool.query(query, [restaurantIDs, timeint, timeint]);
            restaurantIDs = validRestaurants.map(restaurant => restaurant.restaurantID);
        }
        // Find the restaurant information for the restaurantIDs.
        query = `SELECT name, address, isActive, openingTime, closingTime FROM restaurants WHERE restaurantID IN (?)`;
        [finalRestaurantInfos, restaurantError] = await pool.query(query, [restaurantIDs]);
    }
    pool.end();
    return {
        statusCode: 200,
        restaurants: finalRestaurantInfos
    };
    // } catch (error) {
    //     return {
    //         statusCode: 500,
    //         error: "Internal server error",
    //         error_verbose: error.message
    //     };
    // }

};