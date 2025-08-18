import { baseRepo } from "@/lib/modules/common/base_repo";
import { userRepo } from "../repositories/user_repo";
import { User } from "@/lib/models/user";
import { comparePassword, hashPassword } from "@/lib/utils/hash";
import { ApiError } from "@/lib/utils/error";

export const userApp = {
  async verifyUser(email: string, password: string): Promise<User> {
    const user = await baseRepo.getByField<User>(User, User.columns.email, email);
    if (!user) throw new ApiError("Sai tài khoản hoặc mật khẩu", 401);

    const ok = await comparePassword(password, user.password ?? "");
    if (!ok) throw new ApiError("Sai tài khoản hoặc mật khẩu", 401);

    return user;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    return await baseRepo.getByField<User>(User, User.columns.email, email);
  },

  async createUser(userData: Partial<User>): Promise<User> {
    if (!userData.email || !userData.password || !userData.name) {
      throw new ApiError("Email, password và name là bắt buộc", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new ApiError("Email không hợp lệ", 400);
    }

    // Validate password length
    if (userData.password.length < 6) {
      throw new ApiError("Mật khẩu phải có ít nhất 6 ký tự", 400);
    }

    // Check if user already exists
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new ApiError("Email đã được sử dụng", 400);
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(userData.password);
    
    // Generate username from email if not provided
    const username = userData.user_name || userData.email.split('@')[0];
    
    const newUserData = {
      ...userData,
      password: hashedPassword,
      user_name: username,
      is_active: true,
      is_sso: false,
      preferences: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newUser = new User(newUserData);
    return await baseRepo.insert<User>(newUser);
  },

  async execute(data: Partial<User>): Promise<User> {
    if (!data.email || !data.password) {
      throw new ApiError("Email and password are required", 400);
    }
    
    // Check if user already exists
    const existingUser = await baseRepo.getByField<User>(User, User.columns.email, data.email);
    if (existingUser) {
      throw new ApiError("User with this email already exists", 409);
    }

    const newUser = await baseRepo.insert<User>(data);
    return newUser;
  },

  async getAll(): Promise<User[]> {
    return await baseRepo.getAll<User>(User, {
      orderBy: ["created_at"],
      orderDirections: { created_at: "DESC" },
      allowedOrderFields: ["id", "created_at", "name", "user_name"]
    });
  },

  async getById(id: number): Promise<User> {
    const user = await baseRepo.getById<User>(User, id);
    if (!user) {
      throw new ApiError("User not found", 404);
    }
    return user;
  },

  async searchUsers(query: string): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      throw new ApiError("Search query must be at least 2 characters", 400);
    }

    return await userRepo.searchByNameOrUsername(query.trim());
  },

  async searchUsersForMessenger(currentUserId: number, query: string): Promise<any[]> {
    if (!query || query.trim().length < 2) {
      throw new ApiError("Search query must be at least 2 characters", 400);
    }

    return await userRepo.searchUsersWithConversation(currentUserId, query.trim());
  },

  async searchUsersForGroupInvite(currentUserId: number, query: string, groupId: number): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      throw new ApiError("Search query must be at least 2 characters", 400);
    }

    return await userRepo.searchUsersForGroupInvite(currentUserId, query.trim(), groupId);
  },
};
