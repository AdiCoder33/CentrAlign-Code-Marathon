import bcrypt from "bcryptjs";
import { UserModel, IUser } from "../models/User";

const SALT_ROUNDS = 10;

export const signup = async (
  email: string,
  password: string
): Promise<IUser> => {
  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await UserModel.create({ email, passwordHash });
  console.log(`[auth] New user signup: ${user.email}`);
  return user;
};

export const login = async (
  email: string,
  password: string
): Promise<IUser> => {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    console.log(`[auth] User login: ${user.email}`);
    return user;
};
