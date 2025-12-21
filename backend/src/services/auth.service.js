import bcrypt from "bcrypt";
import prisma from "../prisma/client.js";

export const registerUser = async ({ email, password, role }) => {
  if (!email || !password || !role) {
    throw new Error("Missing required fields");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
    },
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
};
