import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import mysql from 'mysql2/promise';
import { createHash } from "crypto";
import pkg from "jsonwebtoken";

const { decode, sign } = pkg;

export const handler = async (event) => {
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
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unable to retrieve database credentials."
      })
    };
  }
  try {
    jwtSecret = await client.send(
      new GetSecretValueCommand({
        SecretId: "tables4u/jwt",
        VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
      })
    );
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unable to retrieve secret.",
        error_verbose: error.messaege
      })
    };
  }

  const dbCredentials = JSON.parse(dbCredentialsSecret.SecretString);

  // create database pool
  const pool = mysql.createPool({
    host: dbCredentials.host,
    user: dbCredentials.username,
    password: dbCredentials.password,
    database: "tables4u"
  });

  // admin username: sam
  // admin password: c7I9!%$DpMK^dB
  // password hash: cddf8602d135d331214e750f479eed808c23b99c07aa87787f303fca19c34cc4

  // hash password
  const passwordHash = createHash('sha256').update(event.password).digest('hex');

  // determine if credentials are in database
  try {
    const connection = await pool.getConnection();

    const [results, _fields] = await pool.execute("select administratorID from administrators natural join credentials where username = ? and passwordHash = ?;",
      [event.username, passwordHash]
    );

    connection.release();

    // check for invalid credentials
    if (results.length == 0) {
      return {
        statusCode: 401,
        error: "Invalid credentials"
      };
    }

    // credentials valid, assemble JWT
    const administratorID = results[0];
    const token = jwt.sign({ administratorID }, jwtSecret, { expiresIn: '1h' });

    return {
      statusCode: 200,
      body: JSON.stringify(token),
    };
  } catch (error) {
    return {
      statusCode: 500,
      error: "Internal server error: unable to perform database query"
    };
  }
};
