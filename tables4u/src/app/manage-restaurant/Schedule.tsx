import { useContext } from 'react';
import styles from './Schedule.module.css';

import { ReservationInfo, RestaurantInfoContext, TablesInfoContext } from './contexts';
import Reservation from './Reservation';

export default function Schedule({ reservations, refreshReservations, isAdmin }: {
    reservations: ReservationInfo[]
    refreshReservations: (form?: any) => void
    isAdmin: boolean
}) {
    const { restaurantInfo } = useContext(RestaurantInfoContext);
    const { tablesInfo } = useContext(TablesInfoContext);
    const numTables = tablesInfo.length;
    const numReservationSlots = restaurantInfo.closingTime - restaurantInfo.openingTime;

    return (
        <div id={styles.schedule}>
            <Times open={restaurantInfo.openingTime} close={restaurantInfo.closingTime}/>
            <div id={styles.gridContainer}>
                <Tables />
                { !restaurantInfo.isActive &&
                    <div id={styles.inactiveWarning}>
                        <h1>Restaurant is Inactive</h1>
                        <p>Because your restaurant is inactive, customers cannot create reservations. Would you like to activate your restaurant?</p>
                        <p>Know that once you activate your restaurant, you cannot deactivate it.</p>
                        <button>Activate Restaurant</button>
                    </div>
                }
                { !!restaurantInfo.isActive && reservations.length > 0 && // needs !! because "0" is rendered by react
                    <div id={styles.grid} style={{
                        gridTemplateRows: `repeat(${numReservationSlots}, 1fr)`,
                        gridTemplateColumns: `repeat(${numTables}, 1fr)`
                    }}>
                    { reservations.map((reservationInfo) => (
                        <Reservation
                            key={reservationInfo.confirmationCode}
                            reservationInfo={reservationInfo}
                            refreshReservations={refreshReservations} isAdmin={isAdmin}/>
                    ))}
                    </div>
                }
                { !!restaurantInfo.isActive && reservations.length == 0 &&
                    <div id={styles.placeholder}>
                        <h2>No reservations today!</h2>
                    </div>
                }
            </div>
        </div>
    )
}

function Times({ open, close }: { open: number, close: number }) {
    // only render every other hour if possible and necessary
    const hoursOpen = close - open;
    const delta = (hoursOpen % 2 == 0 && hoursOpen >= 10) ? 2 : 1;

    const hours = []
    for (let i = open; i <= close; i += delta) hours.push(i);

    return (
        <div id={styles.times}>
            { hours.map((hour) => (
                <p key={hour}>{hour}</p>
            ))}
        </div>
    )
}

function Tables() {
    const { tablesInfo } = useContext(TablesInfoContext);

    return (
        <div id={styles.tables}>
            { tablesInfo.map((table) => (
                <p key={table.number}>Table {table.number} ({table.seats})</p>
            ))}
        </div>
    )
}