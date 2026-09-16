import { hash } from "bcryptjs";

const password = process.argv[2];

if (!password || password.length < 6) {
  console.error("Usage: node scripts/hash-password.mjs <password> (minimum 6 characters)");
  process.exit(1);
}

console.log(await hash(password, 12));
