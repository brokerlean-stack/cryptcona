import { readFile, writeFile, access } from "node:fs/promises";
import { randomBytes } from "node:crypto";
try {
  await access(".env.local");
  console.log(".env.local already exists; nothing changed.");
} catch {
  const template = await readFile(".env.example", "utf8");
  await writeFile(
    ".env.local",
    template
      .replace(
        "NEXT_PUBLIC_SITE_URL=https://cryptcona.pro",
        "NEXT_PUBLIC_SITE_URL=http://localhost:3100",
      )
      .replace(
        "NEXTAUTH_SECRET=",
        "NEXTAUTH_SECRET=" + randomBytes(48).toString("hex"),
      ),
    { flag: "wx" },
  );
  console.log(
    "Created .env.local with a new session secret. Database, Resend and admin credentials remain empty.",
  );
}
