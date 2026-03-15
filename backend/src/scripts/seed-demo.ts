import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";

const demoEmail = process.env.DEMO_EMAIL ?? "admin@prospect.com";
const demoPassword = process.env.DEMO_PASSWORD ?? "prospect123";
const demoName = process.env.DEMO_NAME ?? "Conta Demo";
const demoCompany = process.env.DEMO_COMPANY ?? "Prospect Lead";

async function run() {
  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [demoEmail]
  );

  if (existing.rowCount) {
    console.log(`[SEED] Demo user already exists: ${demoEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, company)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, demoName, demoEmail, passwordHash, demoCompany]
  );

  console.log(`[SEED] Demo user created: ${demoEmail}`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[SEED] Failed to create demo user:", err);
    process.exit(1);
  });
