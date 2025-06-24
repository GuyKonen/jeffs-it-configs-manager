
import { authenticator } from 'otplib';

export class TOTPManager {
  private static readonly SERVICE_NAME = 'JeffFromIT';

  static generateSecret(): string {
    return authenticator.generateSecret();
  }

  static generateQRCodeURL(username: string, secret: string): string {
    return authenticator.keyuri(username, this.SERVICE_NAME, secret);
  }

  static verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  static generateToken(secret: string): string {
    return authenticator.generate(secret);
  }
}
