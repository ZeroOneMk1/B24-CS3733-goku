'use client';
import { FormEvent } from "react";

export default function Create() {
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
    }

    return (
        <div id="create-restaurant-panel">
            <h1>Create a Restaurant</h1>
            <form onSubmit={submit} method="post">
                <div>
                    <div className="panel-input">
                        <label htmlFor="name">Restaurant Name:</label>
                        <input required type="text" name="name" placeholder="Restaurant Name" />
                    </div>
                    <div className="panel-input">
                        <label htmlFor="address">Address:</label>
                        <input required type="text" name="address" placeholder="Restaurant Address" />
                    </div>
                </div>
                <div>
                    <div className="panel-input">
                        <label htmlFor="username">Username:</label>
                        <input required type="text" name="username" placeholder="Username" />
                    </div>
                    <div className="panel-input">
                        <label htmlFor="password">Password:</label>
                        <input required type="text" name="password" placeholder="Password" />
                    </div>
                    <div className="panel-input">
                        <label htmlFor="confirm">Confirm Password:</label>
                        <input required type="text" name="confirm" placeholder="Confirm Password" />
                    </div>
                </div>
                <div>
                    <input type="submit" value="Create" />
                    <a href="/manage">I already have a restaurant</a>
                </div>
            </form>
        </div>
    );
}