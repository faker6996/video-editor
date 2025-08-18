import { refreshTokenRepo } from "../repositories/refresh_token_repo";
import { RefreshToken } from "@/lib/models/refresh_token";
import { createTokenPair } from "@/lib/utils/jwt";
import { getCachedUser } from "@/lib/cache/user";
import { ApiError } from "@/lib/utils/error";
import { safeQuery } from "@/lib/modules/common/safe_query";

class RefreshTokenApplication {
  
  /**
   * Create a new refresh token for user
   */
  async createRefreshToken(userId: number, token: string, expiresAt: Date): Promise<RefreshToken> {
    return await refreshTokenRepo.create(userId, token, expiresAt);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Find and validate refresh token
    const storedToken = await refreshTokenRepo.findByToken(refreshToken);
    if (!storedToken) {
      throw new ApiError("Invalid or expired refresh token", 401);
    }

    // Get user info
    const user = await getCachedUser(storedToken.user_id);
    if (!user) {
      throw new ApiError("User not found", 401);
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = createTokenPair({
      sub: user.id!.toString(),
      email: user.email,
      name: user.name,
      id: user.id!
    });

    // Update user's last_login_at to track user activity
    try {
      await safeQuery(
        `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
        [user.id]
      );
    } catch (error) {
      // Silently fail - not critical for token refresh functionality
    }
    
    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    await refreshTokenRepo.create(user.id!, newRefreshToken, expiresAt);
    
    // Revoke old refresh token
    await refreshTokenRepo.revokeToken(refreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    return await refreshTokenRepo.revokeToken(token);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    return await refreshTokenRepo.revokeAllUserTokens(userId);
  }

  /**
   * Get active tokens for a user
   */
  async getUserActiveTokens(userId: number): Promise<RefreshToken[]> {
    return await refreshTokenRepo.findActiveTokensByUserId(userId);
  }

  /**
   * Get token count for a user (for rate limiting)
   */
  async getUserTokenCount(userId: number): Promise<number> {
    return await refreshTokenRepo.getUserTokenCount(userId);
  }

  /**
   * Cleanup expired tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    return await refreshTokenRepo.cleanupExpiredTokens();
  }

  /**
   * Revoke multiple tokens at once (for admin or bulk operations)
   */
  async revokeMultipleTokens(tokenIds: number[]): Promise<void> {
    return await refreshTokenRepo.revokeMultipleTokens(tokenIds);
  }

  /**
   * Get token statistics for monitoring
   */
  async getTokenStatistics(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    revokedTokens: number;
  }> {
    const allTokens = await refreshTokenRepo.getAllTokens();
    const now = new Date();
    
    return {
      totalTokens: allTokens.length,
      activeTokens: allTokens.filter(t => 
        !t.is_revoked && 
        new Date(t.expires_at) > now
      ).length,
      expiredTokens: allTokens.filter(t => 
        !t.is_revoked && 
        new Date(t.expires_at) <= now
      ).length,
      revokedTokens: allTokens.filter(t => t.is_revoked).length
    };
  }
}

export const refreshTokenApp = new RefreshTokenApplication();