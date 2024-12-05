import { useContext } from 'react';
import styles from './Schedule.module.css';

import { RestaurantInfoContext, TablesInfoContext } from './contexts';

export default function Schedule() {
    const { restaurantInfo } = useContext(RestaurantInfoContext);

    return (
        <div id={styles.schedule}>
            <Times open={restaurantInfo.openingTime} close={restaurantInfo.closingTime}/>
            <div id={styles.gridContainer}>
                <Tables />
                <div id={styles.grid}>

                </div>
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