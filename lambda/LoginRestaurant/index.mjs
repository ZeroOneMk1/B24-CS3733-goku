import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { connect } from "../opt/lib/connect.mjs"

export const handler = async (event) => {
  // retrieve database credentials
  let jwtSecret;

  const client = new SecretsManagerClient({
    region: "us-east-1",
  });

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
        error: "Unable to retrieve verification secret"
      })
    };
  }

  const tokenSecret = JSON.parse(jwtSecret.SecretString).secret;

  // create database pool
  const { pool, error: dbError } = await connect()
  if (dbError) return {
    statusCode: 500,
    error: "Unable to create database connection"
  }

  // hash password
  const passwordHash = createHash('sha256').update(event.password).digest('hex');
  let credentialsResults, _credentialsFields

  // determine if credentials are in database
  try {
    [credentialsResults, _credentialsFields] = await pool.execute("select username, restaurantID from restaurants natural join credentials where username = ? and passwordHash = ?",
      [event.username, passwordHash]
    );

    // check for invalid credentials
    if (credentialsResults.length == 0) {
      return {
        statusCode: 401,
        error: "Invalid credentials"
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      error: "Unable to perform database query"
    };
  }

  // credentials valid, assemble JWT
  const token = jwt.sign({
    username: credentialsResults[0].username,
    restaurantID: credentialsResults[0].restaurantID,
    isAdmin: false
  }, tokenSecret, { expiresIn: '1h' });

  return {
    statusCode: 200,
    jwt: token
  };
};
