import { useEffect, useState } from "react";
import Schedule from "./Schedule";
import { ReservationInfo } from "./contexts";

import styles from "./ReviewAvailability.module.css";

export default function ReviewAvailability({restaurantID}: {restaurantID?: string}) {
    const [refreshStatus, setRefreshStatus] = useState("success");
    const [reservations, setReservations] = useState<ReservationInfo[]>([]);
    const [utilReport, setUtilReport] = useState<number | null>(null);
    const [date, setDate] = useState(() => {
        const date = new Date();
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}-${(date.getDay()+1).toString().padStart(2, "0")}`;
    });
    const [open, setOpen] = useState(true);
    const [ toggling, setToggling ] = useState(false);

    const utilText = utilReport != null ? `(${(utilReport * 100).toFixed(2)}% Util.)` : "";

    //format date
    function formatDate(inputDate: string) {
        const [year, month, day] = inputDate.split('-');
        return `${month}-${day}-${year}`;
    }

    async function refreshReservations(event?: React.FormEvent<HTMLFormElement>) {
        setRefreshStatus("waiting");
        if (event) event.preventDefault();

        // form request body
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/ReviewDaysAvailability";
        let body;
        if(restaurantID == undefined || restaurantID == "") {
            body = JSON.stringify({
                date: formatDate(date),
                jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2)
            });
        } else {
            body = JSON.stringify({
                date: formatDate(date),
                jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2),
                restaurantID: restaurantID
            });
        }

        // send request
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if (result.statusCode == 200) {
            setRefreshStatus("success");
            setReservations(result.response.reservations);
            setUtilReport(result.response.utilReport);
            setOpen(result.response.isOpen == 1);
        } else setRefreshStatus(result.error);
    }

    const toggleButtonText = (open) ? ((toggling) ? "Closing" : "Close") : ((toggling) ? "Opening" : "Open");

    async function openCloseDay() {
        setToggling(true);
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + ((open) ? "/CloseFutureDay" : "/ReopenFutureDay");

        const body = JSON.stringify({
            date: formatDate(date),
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2)
        });

        // send request
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if(result.statusCode == 200) {
            setOpen(result.isOpen == 1);
        } else alert(result.error);

        setToggling(false);
    }

    function showButton() {
        if(restaurantID !== "") {
            return styles.availabilityHidden;
        }
            return;
    }

    useEffect(() => {refreshReservations()}, [])

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
                    <div>
                    <p>Day is <strong>{(open) ? "Open" : "Closed"}</strong></p>
                    <button className="small" onClick={openCloseDay} id={showButton()}>{toggleButtonText}</button>
                    </div>
                </div>
                {refreshStatus !== "waiting" && refreshStatus !== "success" &&
                    <p>Error: {refreshStatus}</p>}
            </div>
            <Schedule reservations={reservations} refreshReservations={refreshReservations} isAdmin={!(restaurantID == "")} />
        </div>
    )
}