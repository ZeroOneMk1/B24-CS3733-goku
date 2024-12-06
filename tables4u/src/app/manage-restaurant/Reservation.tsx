import { CSSProperties, useContext, useState } from 'react';
import styles from './Reservation.module.css';
import type { ReservationInfo } from './contexts';
import { RestaurantInfoContext } from './contexts';

export default function Reservation({ reservationInfo, refreshReservations, isAdmin }: {
    reservationInfo: ReservationInfo
    refreshReservations: (form?: any) => void
    isAdmin: boolean
}) {
    const { restaurantInfo } = useContext(RestaurantInfoContext);
    const [ deleteReservationText, setDeleteReservationText ] = useState("");

    async function deleteReservation() {
        if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
        setDeleteReservationText("Deleting...");
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/CancelExistingReservation";
        const body = JSON.stringify({
            email: reservationInfo.email, confirmation:
            reservationInfo.confirmationCode
        });

        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if (result.statusCode == 200) {
            setDeleteReservationText("");
            refreshReservations();
        } else {
            setDeleteReservationText("Error: " + result.error);
            console.error(result.error);
        }
    }

    const guestText = reservationInfo.customerCount == "1" ? "1 guest" : `${reservationInfo.customerCount} guests`;
    const style: CSSProperties = {
        gridColumn: `${reservationInfo.tableNumber} / span 1`,
        gridRow: `${Number(reservationInfo.time) - restaurantInfo.openingTime + 1} / span 1`
    }

    if (isAdmin && deleteReservationText == "") {
        return (
            <button id={styles.reservation} style={style} onClick={deleteReservation}>
                <h2>{reservationInfo.email}</h2>
                <p>{guestText} @ {reservationInfo.time}</p>
            </button>
        )
    } else if (isAdmin) {
        return (
            <div id={styles.reservation} style={style}>
                <p>{deleteReservationText}</p>
            </div>   
        )
    } else {
        return (
            <div id={styles.reservation} style={style}>
                <h2>{reservationInfo.email}</h2>
                <p>{guestText} @ {reservationInfo.time}</p>
            </div>
        )
    }
}