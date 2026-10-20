import "dotenv/config";
import { execFileSync } from "node:child_process";
import path from "node:path";

process.env.NODE_ENV ??= "test";

const sourceDatabaseUrl = process.env.DATABASE_URL;
if (!sourceDatabaseUrl) {
  throw new Error("DATABASE_URL is required to create the isolated test database for StockFlow tests.");
}

const testDatabaseName = process.env.TEST_DATABASE_NAME ?? `stockflow_test_${Date.now()}`;
const { Client } = await import("pg");

const client = new Client({ connectionString: sourceDatabaseUrl });
await client.connect();

const databaseExists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1;", [testDatabaseName]);
if (databaseExists.rowCount === 0) {
  await client.query(`CREATE DATABASE "${testDatabaseName}";`);
}

await client.end();

const testDatabaseUrl = new URL(sourceDatabaseUrl);
testDatabaseUrl.pathname = `/${testDatabaseName}`;
process.env.TEST_DATABASE_URL = testDatabaseUrl.toString();
process.env.DATABASE_URL = testDatabaseUrl.toString();

const schemaPath = path.resolve(process.cwd(), "prisma", "schema.prisma");
const prismaCliPath = path.resolve(process.cwd(), "node_modules", "prisma", "build", "index.js");
execFileSync(process.execPath, [prismaCliPath, "db", "push", "--schema", schemaPath, "--skip-generate"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: testDatabaseUrl.toString() },
});
