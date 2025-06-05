// src/api.js

export async function loginUser(email, password) {
  const response = await fetch('http://jewels_prod.com/api/users/user_login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: email,
      password: password,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Login failed');
  }

  return result.data;
}

// Available jobs API
export async function fetchAvailableJobs(driverId, token) {
  const response = await fetch(
    `http://jewels_prod.com/api/users/available_jobs/${driverId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) throw new Error('Failed to fetch jobs');
  const data = await response.json();
  return Array.isArray(data.data) ? data.data : [];
}