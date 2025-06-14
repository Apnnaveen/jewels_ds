// src/api.js

//user_login
export async function loginUser(email, password) {
  const response = await fetch('http://jewels.com/api/users/driver_login', {
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
    throw new Error(result.error || 'Login failed');
  }

  return result.data;
}

// Available jobs API
export async function fetchAvailableJobs(driverId, token) {
  const response = await fetch(
    `http://jewels.com/api/users/available_jobs/${driverId}`,
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
//
// user_profile
export async function getUserProfile(driverId, token) {
  const response = await fetch(`http://jewels.com/api/users/show_profile/${driverId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch user profile');
  }

  return result.data;
}
//
// update_password
export async function updatePassword(driverId, token, oldPassword, newPassword, confirmPassword) {
  const response = await fetch(`http://jewels.com/api/users/update_password/${driverId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update password');
  }

  return result.data;
}
//
// delete_account
export async function deleteAccount(driverId, token) {
  const response = await fetch(`http://jewels.com/api/users/delete_account/${driverId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to delete account');
  }

  return result.data;
}
//
// scheduled jobs
export async function getScheduledJobs(driverId, token) {
  const response = await fetch(`http://jewels.com/api/users/scheduled_journey_details/${driverId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch scheduled jobs');
  }

  return result.data;
}
export async function fetchJourneyDetails(booking_journey_id, driverId, token) {
  console.log('Fetching journey details for bookingId:', booking_journey_id, 'and driverId:', driverId);
  const response = await fetch(
    `http://jewels.com/api/users/journeyDetails`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        booking_journey_id: booking_journey_id,
        driver_id: driverId,
      }),
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch journey details');
  }

  return result.data;
}
// ...existing code...

export async function bidJob({ booking_journey_id, driver_id, email, fare, token }) {
  console.log('Submitting bid for booking_journey_id:', booking_journey_id, 'driver_id:', driver_id, 'email:', email, 'fare:', fare); 
  const response = await fetch('http://jewels.com/api/users/bid_job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      driver_id,
      booking_journey_id,
      bid_amount: fare,
      email,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to submit bid');
  }
  return result.data;
}

export async function changePasswordByForceStatus(email, newPassword, confirmPassword) {

  const response = await fetch('http://jewels.com/api/users/change_password_by_force_status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to change password');
  }

  return result.data;
}
export async function bid_history(driver_id, token) {
 // NO proxy setup? Then use full API URL
const response = await fetch(`http://jewels.com/api/users/bid_history/${driver_id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
});


  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch bid history');
  }

  return result.data;
}
export async function scheduled_journey_details(driver_id, token) {
  const response = await fetch(`http://jewels.com/api/users/scheduled_journey_details/${driver_id}`, {
      method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
});


  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch bid history');
  }

  return result.data;
}