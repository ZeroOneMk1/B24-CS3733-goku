'use client';
import { useState, useEffect, useContext } from "react";
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

import BasicInformation from "./BasicInformation";
import Tables from "./Tables";
import DeleteRestaurant from "./DeleteRestaurant";
import Schedule from "./Schedule";
import SearchDayAvailability from "./SearchDayAvailability"

import type { RestaurantInfo, ReservationInfo } from "./contexts";
import { RestaurantInfoContext, TablesInfoContext } from "./contexts";

export default function ManageRestaurant() {
    const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
        name: "",
        address: "",
        isActive: false,
        openingTime: 0,
        closingTime: 0,
    });

    const [tablesInfo, setTablesInfo] = useState([{
        number: 0,
        seats: 0
    }]);

    const [restaurantInfoStatus, setRestaurantInfoStatus] = useState("waiting");

    async function getRestaurantInfo() {
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/GetRestaurantInfo";
        const body = JSON.stringify({
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2)
        })

        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();
        if (result.statusCode == 200) {
            setRestaurantInfoStatus("success");
            const info = JSON.parse(result.body).restaurantInfo;

            setRestaurantInfo({
                name: info.name,
                address: info.address,
                isActive: info.isActive,
                openingTime: info.openingTime,
                closingTime: info.closingTime
            });

            const tables: { number: number, seats: number }[] = []
            for (const table of JSON.parse(result.body).tables)
                tables.push({ number: table.number, seats: table.seats });
            setTablesInfo(tables);

            // restaurantID = info.restaurantID;
        } else setRestaurantInfoStatus(result.error);
    }

    useEffect(() => { getRestaurantInfo(); }, []);

    if (restaurantInfoStatus == "waiting") {
        return (
            <div id={styles.restaurantDetailsPlaceholder}>
                <h1>Waiting...</h1>
            </div>
        )
    } else if (restaurantInfoStatus !== "success") {
        return (
            <div id={styles.restaurantDetailsPlaceholder}>
                <h1>Oops!</h1>
                <p>{restaurantInfoStatus}</p>
                <button>Try Again</button>
            </div>
        )
    } else {
        return (
            <RestaurantInfoContext.Provider value={{ restaurantInfo, setRestaurantInfo }}>
                <TablesInfoContext.Provider value={{ tablesInfo, setTablesInfo }}>
                    <div id={styles.content}>
                        <RestaurantDetails />
                        <ReviewAvailability />
                    </div>
                </TablesInfoContext.Provider>
            </RestaurantInfoContext.Provider>
        )
    }
}

function RestaurantDetails() {
    const router = useRouter();
    const { restaurantInfo } = useContext(RestaurantInfoContext);

    function logout() {
        document.cookie = "jwt=;";
        router.push("/");
    }

    return (
        <div id={styles.restaurantDetails}>
            <h1>Restaurant Details</h1>
            <BasicInformation />
            <Tables isActive={restaurantInfo.isActive} />
            <DeleteRestaurant restaurantInfo={restaurantInfo} />
            <button onClick={logout}>Logout</button>
        </div>
    )
}

function ReviewAvailability() {
    const [refreshStatus, setRefreshStatus] = useState("success");
    const [reservations, setReservations] = useState<ReservationInfo[]>([]);
    const [utilReport, setUtilReport] = useState<number | null>(null);
    const [date, setDate] = useState('');

    const utilText = utilReport != null ? `(${(utilReport * 100).toFixed(2)}% Util.)` : "";

    //format date
    function formatDate(inputDate: string) {
        const [year, month, day] = inputDate.split('-');
        return `${month}-${day}-${year}`;
    }

    async function refreshReservations(event: React.FormEvent<HTMLFormElement>) {
        setRefreshStatus("waiting");
        event.preventDefault();

        // form request body
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/ReviewDaysAvailability";
        const body = JSON.stringify({
            date: formatDate(date),
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2)
        });

        // send request
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if (result.statusCode == 200) {
            setRefreshStatus("success");
            setReservations(result.response.reservations);
            setUtilReport(result.response.utilReport);
        } else setRefreshStatus(result.error);
    }

    return (
        <div id={styles.reviewAvailability}>
            <div id={styles.availabilityHeader}>
                <div>
                    <h1>Review Availability</h1>
                    <p>Total Reservations: <strong>{reservations.length} {utilText}</strong></p>
                </div>
                <div>
                    <form onSubmit={refreshReservations}>
                        <label htmlFor="date">Day:</label>
                        <input type="date" name="date" id="date"
                            required value={date} onChange={(e) => setDate(e.target.value)} />
                        <input type="submit" value={refreshStatus == "waiting" ? "Loading..." : "Refresh"} />
                    </form>
                    <div id={styles.toggleDay}>
                        <p>Day is <strong>Open</strong></p>
                        <button className="small">Close</button>
                    </div>
                </div>
                {refreshStatus !== "waiting" && refreshStatus !== "success" &&
                    <p>Error: {refreshStatus}</p>}
            </div>
            <Schedule reservations={reservations} />
        </div>
    )
}
