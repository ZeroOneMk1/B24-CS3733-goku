import styles from './Schedule.module.css';

export default function Schedule({

}: {

}) {
    return (
        <div id={styles.schedule}>
            <Times />
            <div id={styles.gridContainer}>
                <Tables />
                <div id={styles.grid}>

                </div>
            </div>
        </div>
    )
}

function Times() {
    return (
        <div id={styles.times}>
            <p>1pm</p>
            <p>3pm</p>
            <p>5pm</p>
            <p>7pm</p>
            <p>9pm</p>
            <p>11pm</p>
        </div>
    )
}

function Tables() {
    return (
        <div id={styles.tables}>
            <p>Table 1</p>
            <p>Table 2</p>
            <p>Table 3</p>
            <p>Table 4</p>
            <p>Table 5</p>
        </div>
    )
}