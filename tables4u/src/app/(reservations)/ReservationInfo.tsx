import { useEffect, useState } from "react";

export default function ReservationInfo({
    code, email
}: {
    code: number,
    email: string
}) {
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

    function formatDateAndTime(date: string, time: number) {
        return "Monday, November 11th @ 7PM";
    }

    useEffect(() => { findExistingReservation(); }, []);

    if (findReservationStatus == "success" && reservationInfo) {
        return (
            <div>
                <div>
                    <h2>{reservationInfo.restaurant}</h2>
                    <p>{reservationInfo.guestCount} guests • {formatDateAndTime(reservationInfo.date, reservationInfo.time)}</p>
                    <p>{reservationInfo.email}</p>
                </div>
                <div>
                    <h2>Your confirmation code is:</h2>
                    <h1>{reservationInfo.confirmation}</h1>
                </div>
                <a href="/find-reservation">Find another reservation</a>
            </div>
        )
    } else if (findReservationStatus == "waiting") {
        return (
            <div>
                <p>Waiting...</p>
            </div>
        )
    } else {
        return (
            <div>
                <h1>Oops!</h1>
                <p>Unable to find reservation: {findReservationStatus}</p>
                <a href="/find-reservation">Try again</a>
            </div>
        )
    }
}