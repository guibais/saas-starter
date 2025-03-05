import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Database connection string from environment variables
const connectionString = process.env.DATABASE_URL || "";

// Create a new postgres client
const client = postgres(connectionString, { max: 1 });

// Create a drizzle instance with the client and schema
export const db = drizzle(client, { schema });

// Export the schema for use in other modules
export { schema };
