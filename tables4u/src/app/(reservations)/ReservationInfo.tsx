import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import styles from './ReservationInfo.module.css';

export default function ReservationInfo({
    code, email, canDelete
}: {
    code: number,
    email: string,
    canDelete: boolean
}) {
    const router = useRouter();

    const [ reservationInfo, setReservationInfo ] = useState<{
        restaurant: string
        guestCount: number
        date: string
        time: number
        email: string
        confirmation: number
        name: string
    } | null>(null);
    const [ findReservationStatus, setFindReservationStatus ] = useState("waiting");
    const [ deleteReservationText, setDeleteReservationText ] = useState("Delete Reservation");

    async function findExistingReservation() {
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/FindExistingReservation";
        const body = JSON.stringify({ email, confirmation: code });

        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if (result.statusCode == 200) {
            setReservationInfo(result.body);
            setFindReservationStatus("success");
        } else setFindReservationStatus(result.error);
    }

    async function deleteReservation() {
        setDeleteReservationText("Deleting...");
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/CancelExistingReservation";
        const body = JSON.stringify({ email, confirmation: code });

        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if (result.statusCode == 200) {
            setDeleteReservationText("Deleted... Redirecting");
            router.push("/reserve");
        } else {
            setDeleteReservationText("Error");
            console.error(result.error);
        }
    }

    function formatDateAndTime(date: string, time: number) {
        // parse date
        const dateSplit = date.split("-");
        const dateObject = new Date(
            Number(dateSplit[0]),
            Number(dateSplit[1]) - 1,
            Number(dateSplit[2])
        );

        // format date into string
        const dateString = dateObject.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        // parse time
        const timeValue = (time) ? (time - 1) % 12 + 1 : 12;
        const timeSuffix = (time < 12) ? "AM" : "PM";

        return `${dateString} @ ${timeValue}${timeSuffix}`;
    }

    useEffect(() => { findExistingReservation(); }, []);

    if (findReservationStatus == "success" && reservationInfo) {
        return (
            <div id={styles.reservation}>
                <h1>View Reservation</h1>
                <div>
                    <h2>{reservationInfo.restaurant}</h2>
                    <p>{reservationInfo.guestCount} guests • {formatDateAndTime(reservationInfo.date, reservationInfo.time)}</p>
                    <p>{reservationInfo.email}</p>
                </div>
                <div>
                    <h2>Your confirmation code is:</h2>
                    <h1>{reservationInfo.confirmation}</h1>
                </div>
                <div id={styles.submit}>
                    { canDelete && <button onClick={deleteReservation}>{deleteReservationText}</button> }
                    <a href="/find-reservation">Find another reservation</a>
                </div>
            </div>
        )
    } else if (findReservationStatus == "waiting") {
        return (
            <div id={styles.reservation}>
                <p>Waiting...</p>
            </div>
        )
    } else {
        return (
            <div id={styles.reservation}>
                <h1>Oops!</h1>
                <p>Unable to find reservation: {findReservationStatus}</p>
                <a href="/find-reservation">Try again</a>
            </div>
        )
    }
}