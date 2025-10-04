// Draft of unused or unclear context functions.
// These were moved from Context.jsx for safekeeping and future reference.
// If needed later, import and wire them back deliberately.

import {
  authUrl,
  adminUrl
} from './apiUrls';

// Keep same base URL logic as Context.jsx
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Minimal helper copied for isolation
const getAuthToken = () => localStorage.getItem('authToken');

// ===== AUTHENTICATION API FUNCTIONS =====
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${authUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('User registered:', data);
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register user');
    }
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await fetch(`${authUrl}/verify-email?token=${token}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Email verified:', data);
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to verify email');
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
};

export const requestPasswordReset = async (email) => {
  try {
    const response = await fetch(`${authUrl}/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Password reset requested:', data);
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to request password reset');
    }
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await fetch(`${authUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Password reset:', data);
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reset password');
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// ===== ADMIN API FUNCTIONS =====
export const fetchAllAdmins = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${adminUrl}/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('All admins fetched:', data);
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch all admins');
    }
  } catch (error) {
    console.error('Error fetching all admins:', error);
    throw error;
  }
};

export const createAdmin = async (adminData) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${adminUrl}/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Admin created:', data);
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create admin');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
};

export const updateAdmin = async (adminId, adminData) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${adminUrl}/${adminId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Admin updated:', data);
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update admin');
    }
  } catch (error) {
    console.error('Error updating admin:', error);
    throw error;
  }
};

export const deleteAdmin = async (adminId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${adminUrl}/${adminId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Admin deleted:', data);
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete admin');
    }
  } catch (error) {
    console.error('Error deleting admin:', error);
    throw error;
  }
};

// ===== USER API FUNCTIONS =====
export const updateUser = async (userId, userData) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('User updated:', data);
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update user');
    }
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('User deleted:', data);
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Note: These are not wired into Context provider intentionally.