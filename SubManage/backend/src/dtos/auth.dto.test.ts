import {
  LoginDtoSchema,
  RegisterDtoSchema,
  PasswordResetRequestDtoSchema,
  PasswordResetDtoSchema,
} from './auth.dto';

/**
 * Tests for authentication DTOs
 * 
 * Validates Requirements:
 * - 1.1: Login interface validation
 * - 1.4: Registration interface validation
 * - 1.5: Password reset interface validation
 * - 2.1-2.4: Password complexity validation
 * - 21.2: Clear and actionable error messages
 */

describe('LoginDtoSchema', () => {
  it('should validate correct login data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'Test@1234',
    };

    const result = LoginDtoSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.password).toBe('Test@1234');
    }
  });

  it('should normalize email to lowercase', () => {
    const data = {
      email: 'Test@Example.COM',
      password: 'Test@1234',
    };

    const result = LoginDtoSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('should reject missing email', () => {
    const data = {
      password: 'Test@1234',
    };

    const result = LoginDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('expected string');
    }
  });

  it('should reject empty email', () => {
    const data = {
      email: '',
      password: 'Test@1234',
    };

    const result = LoginDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email is required');
    }
  });

  it('should reject invalid email format', () => {
    const data = {
      email: 'invalid-email',
      password: 'Test@1234',
    };

    const result = LoginDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email format');
    }
  });

  it('should reject missing password', () => {
    const data = {
      email: 'test@example.com',
    };

    const result = LoginDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('expected string');
    }
  });

  it('should reject empty password', () => {
    const data = {
      email: 'test@example.com',
      password: '',
    };

    const result = LoginDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password is required');
    }
  });
});

describe('RegisterDtoSchema', () => {
  it('should validate correct registration data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'Test@1234',
    };

    const result = RegisterDtoSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.password).toBe('Test@1234');
      expect(result.data.role).toBe('Portal_User'); // Default role
    }
  });

  it('should accept custom role', () => {
    const data = {
      email: 'test@example.com',
      password: 'Test@1234',
      role: 'Admin' as const,
    };

    const result = RegisterDtoSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('Admin');
    }
  });

  it('should reject password shorter than 9 characters', () => {
    const data = {
      email: 'test@example.com',
      password: 'Test@12',
    };

    const result = RegisterDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must be longer than 8 characters');
    }
  });

  it('should reject password without uppercase letter', () => {
    const data = {
      email: 'test@example.com',
      password: 'test@1234',
    };

    const result = RegisterDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must contain at least one uppercase letter');
    }
  });

  it('should reject password without lowercase letter', () => {
    const data = {
      email: 'test@example.com',
      password: 'TEST@1234',
    };

    const result = RegisterDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must contain at least one lowercase letter');
    }
  });

  it('should reject password without special character', () => {
    const data = {
      email: 'test@example.com',
      password: 'Test12345',
    };

    const result = RegisterDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must contain at least one special character');
    }
  });

  it('should reject invalid role', () => {
    const data = {
      email: 'test@example.com',
      password: 'Test@1234',
      role: 'InvalidRole',
    };

    const result = RegisterDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('PasswordResetRequestDtoSchema', () => {
  it('should validate correct password reset request data', () => {
    const validData = {
      email: 'test@example.com',
    };

    const result = PasswordResetRequestDtoSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('should normalize email to lowercase', () => {
    const data = {
      email: 'Test@Example.COM',
    };

    const result = PasswordResetRequestDtoSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('should reject missing email', () => {
    const data = {};

    const result = PasswordResetRequestDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('expected string');
    }
  });

  it('should reject invalid email format', () => {
    const data = {
      email: 'invalid-email',
    };

    const result = PasswordResetRequestDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email format');
    }
  });
});

describe('PasswordResetDtoSchema', () => {
  it('should validate correct password reset data', () => {
    const validData = {
      token: 'valid-token-string',
      newPassword: 'NewTest@1234',
    };

    const result = PasswordResetDtoSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.token).toBe('valid-token-string');
      expect(result.data.newPassword).toBe('NewTest@1234');
    }
  });

  it('should reject missing token', () => {
    const data = {
      newPassword: 'NewTest@1234',
    };

    const result = PasswordResetDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('expected string');
    }
  });

  it('should reject empty token', () => {
    const data = {
      token: '',
      newPassword: 'NewTest@1234',
    };

    const result = PasswordResetDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Token is required');
    }
  });

  it('should reject weak new password', () => {
    const data = {
      token: 'valid-token-string',
      newPassword: 'weak',
    };

    const result = PasswordResetDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('should reject new password without uppercase letter', () => {
    const data = {
      token: 'valid-token-string',
      newPassword: 'newtest@1234',
    };

    const result = PasswordResetDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must contain at least one uppercase letter');
    }
  });
});
