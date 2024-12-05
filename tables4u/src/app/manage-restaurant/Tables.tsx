import { FormEvent, useState, useEffect, useContext } from "react";
import styles from "./Tables.module.css";

import { TablesInfoContext } from "./page";

export default function Tables({ isActive }: { isActive: boolean }) {
    const [ addTableStatus, setAddTableStatus ] = useState(" ");
    const { tablesInfo, setTablesInfo } = useContext(TablesInfoContext);

    async function addTable() {
        setAddTableStatus("Adding...");
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/AddTable";
        const body = JSON.stringify({
            seats: 1,
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2),
        });

        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if (result.statusCode == 200) {
            const tables = JSON.parse(result.body).tables;
            setTablesInfo(tables);
            setAddTableStatus("Table added.");
            setTimeout(() => {setAddTableStatus(" ")}, 2000);
        } else setAddTableStatus(result.error);
    }

    if (!isActive) {return (
        <div id={styles.tables}>
            <h2>Tables</h2>
            {tablesInfo.map(table => (
                <Table key={table.number} tableInfo={table} />
            ))}
            <button disabled={addTableStatus == "Adding..."} onClick={addTable}>Add Table</button>
            <p>{addTableStatus}</p>
        </div>
    )} else {return(
        <div id={styles.tablesActive}>
            <h2>Tables</h2>
            <p>{tablesInfo.length} tables, {tablesInfo.reduce((a, c) => a + c.seats, 0)} seats</p>
            {tablesInfo.map(table => (
                <p key={table.number}>Table {table.number}: {table.seats} seats</p>
            ))}
        </div>
    )}
}

function Table({ tableInfo }: { tableInfo: { number: number, seats: number } }) {
    const [ seatsValue, setSeatsValue ] = useState(tableInfo.seats);
    const [ status, setStatus ] = useState("idle");
    const [ errorMessage, setErrorMessage ] = useState(" ");

    const { setTablesInfo } = useContext(TablesInfoContext);

    const changed = seatsValue != tableInfo.seats;
    const jwt = document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2);

    // change button text based on editing or deleting, and working or not
    const buttonText = status == "error" ? "Error" : (
        status == "idle" ? ( changed ? "Save" : "Remove")
        : ( changed ? "Saving" : "Removing")
    );

    // make sure the input value changes when the number of seats is updated
    useEffect(() => {
        setSeatsValue(tableInfo.seats);
    }, [tableInfo])

    async function editTable(event: FormEvent<HTMLFormElement>) {
        setStatus("working");
        event.preventDefault();

        // form request
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/EditTable"
        const formData = new FormData(event.currentTarget);
        const body = JSON.stringify({
            number: tableInfo.number.toString(),
            seats: formData.get("seats"), jwt
        });

        // send request and wait for response
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        // determine if edit was successful
        if (result.statusCode == 200) {
            setStatus("idle");
            setErrorMessage(" ");
            const tables = JSON.parse(result.body).tables;
            setTablesInfo(tables);
        } else {
            setStatus("error");
            setErrorMessage(result.error);
        }
    }

    async function deleteTable(event: FormEvent<HTMLFormElement>) {
        // form request
        setStatus("working");
        event.preventDefault();
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/DeleteTable";
        const body = JSON.stringify({
            number: tableInfo.number, jwt
        });

        // send request and wait for response
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        // determine if deletion was successful
        if (result.statusCode == 200) {
            setStatus("idle");
            setErrorMessage(" ");
            const tables = JSON.parse(result.body).tables;
            setTablesInfo(tables);
        } else {
            setStatus("error");
            setErrorMessage(result.error);
        }
    }

    return(
        <div className={styles.table}>
            <form onSubmit={changed? editTable : deleteTable}>
                <p className={styles.tableNumber}>Table {tableInfo.number}:</p>
                <input type="number" name="seats" id="seats" min="1" max="8" value={seatsValue}
                    onChange={event => setSeatsValue(Number(event.target.value))}/>
                <label className={styles.tableSeats} htmlFor="seats">seats</label>
                <input className="small" type="submit" value={buttonText}/>
                <p>{errorMessage}</p>
            </form>
        </div>
    )
}