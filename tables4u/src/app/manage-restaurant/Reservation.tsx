import { CSSProperties, useContext } from 'react';
import styles from './Reservation.module.css';
import type { ReservationInfo } from './contexts';
import { RestaurantInfoContext } from './contexts';

export default function Reservation({ reservationInfo }: { reservationInfo: ReservationInfo }) {
    const { restaurantInfo } = useContext(RestaurantInfoContext);

    const guestText = reservationInfo.customerCount == "1" ? "1 guest" : `${reservationInfo.customerCount} guests`;
    const style: CSSProperties = {
        gridColumn: `${reservationInfo.tableNumber} / span 1`,
        gridRow: `${Number(reservationInfo.time) - restaurantInfo.openingTime + 1} / span 1`
    }
    return (
        <div id={styles.reservation} style={style}>
            <h2>{reservationInfo.email}</h2>
            <p>{guestText} @ {reservationInfo.time}</p>
        </div>
    )
}