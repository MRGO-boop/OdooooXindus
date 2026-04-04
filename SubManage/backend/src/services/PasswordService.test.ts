import { PasswordService } from './PasswordService';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hash', () => {
    it('should hash a valid password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await passwordService.hash(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await passwordService.hash(password);
      const hash2 = await passwordService.hash(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty password', async () => {
      await expect(passwordService.hash('')).rejects.toThrow('Password cannot be empty');
    });

    it('should throw error for whitespace-only password', async () => {
      await expect(passwordService.hash('   ')).rejects.toThrow('Password cannot be empty');
    });
  });

  describe('verify', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await passwordService.hash(password);
      const isValid = await passwordService.verify(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = await passwordService.hash(password);
      const isValid = await passwordService.verify(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should throw error for empty password', async () => {
      const hashedPassword = await passwordService.hash('TestPassword123!');
      await expect(passwordService.verify('', hashedPassword)).rejects.toThrow('Password cannot be empty');
    });

    it('should throw error for empty hashed password', async () => {
      await expect(passwordService.verify('TestPassword123!', '')).rejects.toThrow('Hashed password cannot be empty');
    });

    it('should throw error for whitespace-only password', async () => {
      const hashedPassword = await passwordService.hash('TestPassword123!');
      await expect(passwordService.verify('   ', hashedPassword)).rejects.toThrow('Password cannot be empty');
    });
  });
});
