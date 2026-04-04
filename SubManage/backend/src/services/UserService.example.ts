/**
 * UserService Usage Examples
 * 
 * This file demonstrates how to use the UserService for user registration
 * and management in the Subscription Management System.
 */

import { userService } from './UserService';
import { authService } from './AuthService';

/**
 * Example 1: Register a new user
 */
async function registerNewUser() {
  try {
    const user = await userService.register(
      'john.doe@example.com',
      'SecurePass123!'
    );
    
    console.log('User registered successfully:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });
    
    return user;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

/**
 * Example 2: Register a user with a specific role (Admin only)
 */
async function registerInternalUser() {
  try {
    const user = await userService.register(
      'staff@example.com',
      'StaffPass123!',
      'Internal_User'
    );
    
    console.log('Internal user registered:', user.email);
    return user;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

/**
 * Example 3: Complete registration and login flow
 */
async function registerAndLogin() {
  try {
    // Step 1: Register the user
    const user = await userService.register(
      'newuser@example.com',
      'MyPassword123!'
    );
    
    console.log('User registered:', user.email);
    
    // Step 2: Login with the same credentials
    const authResult = await authService.login(
      'newuser@example.com',
      'MyPassword123!'
    );
    
    console.log('Login successful:', {
      token: authResult.token,
      user: authResult.user,
    });
    
    return authResult;
  } catch (error) {
    console.error('Registration or login failed:', error);
    throw error;
  }
}

/**
 * Example 4: Handle validation errors
 */
async function handleValidationErrors() {
  try {
    // This will fail due to weak password
    await userService.register('test@example.com', 'weak');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation error:', error.message);
      // Expected output: "User registration failed: Password must be longer than 8 characters; 
      // Password must contain at least one uppercase letter; 
      // Password must contain at least one special character"
    }
  }
  
  try {
    // This will fail due to duplicate email
    await userService.register('existing@example.com', 'ValidPass123!');
    await userService.register('existing@example.com', 'AnotherPass123!');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Duplicate email error:', error.message);
      // Expected output: "User registration failed: Email address is already registered"
    }
  }
}

/**
 * Example 5: Retrieve user information
 */
async function getUserInformation() {
  try {
    // Register a user first
    const registeredUser = await userService.register(
      'lookup@example.com',
      'LookupPass123!'
    );
    
    // Retrieve by ID
    const userById = userService.getUserById(registeredUser.id);
    console.log('User by ID:', userById);
    
    // Retrieve by email (case-insensitive)
    const userByEmail = userService.getUserByEmail('LOOKUP@EXAMPLE.COM');
    console.log('User by email:', userByEmail);
    
    // Both should return the same user
    console.log('Same user?', userById?.id === userByEmail?.id);
  } catch (error) {
    console.error('Error retrieving user:', error);
    throw error;
  }
}

/**
 * Password Complexity Requirements:
 * 
 * ✓ Length must be greater than 8 characters
 * ✓ Must contain at least one uppercase letter (A-Z)
 * ✓ Must contain at least one lowercase letter (a-z)
 * ✓ Must contain at least one special character (!@#$%^&*()_+-=[]{};':"\\|,.<>/?)
 * 
 * Valid examples:
 * - "MyPassword123!"
 * - "Secure@Pass1"
 * - "C0mpl3x#Pass"
 * 
 * Invalid examples:
 * - "short1!" (too short)
 * - "nouppercasepass123!" (no uppercase)
 * - "NOLOWERCASEPASS123!" (no lowercase)
 * - "NoSpecialChar123" (no special character)
 */

export {
  registerNewUser,
  registerInternalUser,
  registerAndLogin,
  handleValidationErrors,
  getUserInformation,
};
