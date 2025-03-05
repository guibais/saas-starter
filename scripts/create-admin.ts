import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/session";

async function createAdmin() {
  try {
    // Admin user details - you can change these as needed
    const adminEmail = "admin@example.com";
    const adminPassword = "Admin123!";
    const adminName = "System Administrator";

    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, adminEmail),
    });

    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists.`);
      process.exit(0);
    }

    // Hash the password
    const passwordHash = await hashPassword(adminPassword);

    // Create the admin user
    const [admin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log("Admin user created successfully:");
    console.log({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
  process.exit(0);
}

createAdmin();
