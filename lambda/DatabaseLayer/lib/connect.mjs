import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import mysql from 'mysql2/promise';

/**
 * Creates a connection to the tables4u database. Note that this function
 * does NOT verify that the connection is valid.
 * @returns A MySQL pool that can be used to execute database queries, or
 * an error if unable to retrieve database credentials in the form `{ pool, error}`
 */
export async function connect() {
    // retrieve database credentials
    let dbCredentialsSecret;
    const client = new SecretsManagerClient({
        region: "us-east-1",
    });

    try {
        dbCredentialsSecret = await client.send(
            new GetSecretValueCommand({
                SecretId: "tables4u/MySQL",
                VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
            })
        );
    } catch (error) {
        return { error: "Unable to retrieve database credentials" };
    }
    
    const dbCredentials = JSON.parse(dbCredentialsSecret.SecretString);

    // create database pool
    const pool = mysql.createPool({
        host: dbCredentials.host,
        user: dbCredentials.username,
        password: dbCredentials.password,
        database: "tables4u"
    });

    return { pool };
}