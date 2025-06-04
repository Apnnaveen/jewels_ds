
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
