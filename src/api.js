// src/api.js

//user_login
export async function loginUser(email, password) {
  const response = await fetch('https://jat-uk.com/api/users/driver_login', {
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
  let environment = 'portal';
  const response = await fetch(
    `https://jat-uk.com/api/users/available_jobs/${driverId}/${environment}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) throw new Error('Failed to fetch jobs');
  const data = await response.json();
  console.log('Available jobs data:', data);
  return Array.isArray(data.data) ? data.data : [];
}
//
// user_profile
export async function getUserProfile(driverId, token) {
  const response = await fetch(`https://jat-uk.com/api/users/show_profile/${driverId}`, {
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
  const response = await fetch(`https://jat-uk.com/api/users/update_password/${driverId}`, {
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
  const response = await fetch(`https://jat-uk.com/api/users/delete_account/${driverId}`, {
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
  const response = await fetch(`https://jat-uk.com/api/users/scheduled_journey_details/${driverId}`, {
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
    `https://jat-uk.com/api/users/journeyDetails`,
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
  const response = await fetch('https://jat-uk.com/api/users/bid_job', {
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

  const response = await fetch('https://jat-uk.com/api/users/change_password_by_force_status', {
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
  let environment = 'portal';
  const response = await fetch(`https://jat-uk.com/api/users/bid_history/${driver_id}/${environment}`, {
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
  let environment = 'portal';
  const response = await fetch(`https://jat-uk.com/api/users/scheduled_journey_details/${driver_id}/${environment}`, {
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
export async function upcoming_journey_details(driver_id, token) {
  let environment = 'portal';
  const response = await fetch(`https://jat-uk.com/api/users/upcoming_journeys/${driver_id}/${environment}`, {
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
export async function tomorrow_journeys(driver_id, token) {
  let environment = 'portal';
  const response = await fetch(`https://jat-uk.com/api/users/tomorrow_journeys/${driver_id}/${environment}`, {
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
export async function completed_journeys(driver_id, token) {
  const response = await fetch(`https://jat-uk.com/api/users/completed_journey_details/${driver_id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch data');
  }

  return Array.isArray(result.data) ? result.data : []; // return empty array if not valid
}
export async function confirmAvailability({ driver_id, booking_journey_id, status, token }) {
  const response = await fetch('https://jat-uk.com/api/users/confirm_availability', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      driver_id,
      booking_journey_id,
      status,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to confirm availability');
  }
  return result.data;
}
// Decline job API
export async function declineJob({ booking_journey_id, driver_id, token }) {
  const response = await fetch(`https://jat-uk.com/api/users/declined/${booking_journey_id}/${driver_id}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to decline job');
  }
  return result.data;
}
export async function updateJobData({ driver_id, booking_journey_id, status_code, token }) {
  const response = await fetch(`https://jat-uk.com/api/users/update_icon_data/${driver_id}/${booking_journey_id}/${status_code}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update job data');
  }
  return result.data;
}
export async function getAllCars(driverId, token) {
  const response = await fetch(`https://jat-uk.com/api/users/get_all_cars/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch cars');
  }

  return result.data;
}
// acknowledge_status API
export async function acknowledgeStatus({ driver_id, booking_journey_id, acknowledge_status, token }) {
  const response = await fetch('https://jat-uk.com/api/users/acknowledge_status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      driver_id,
      booking_journey_id,
      acknowledge_status,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update acknowledged status');
  }
  return result.data;
}
export async function withdrawJob({ driver_id, booking_journey_id, token }) {
  const response = await fetch(
    `https://jat-uk.com/api/users/withdraw_job/${driver_id}/${booking_journey_id}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to withdraw job');
  }
  return result.data;
}
export async function getSupplierMappedDrivers({ supplier_id, booking_jou_id, token }) {
  const response = await fetch(
    `https://jat-uk.com/api/users/get_supplier_mapped_drivers/${supplier_id}/${booking_jou_id}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch supplier mapped drivers');
  }

  return result.data; // Contains array of driver info
}
export async function assignDriverToJourney({ booking_jou_id, driver_id, fare, token }) {
  const response = await fetch(`https://jat-uk.com/api/users/assignedsubs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token}`,
    },
    body: new URLSearchParams({
      booking_jou_id,
      driver_id,
      fare,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to assign driver');
  }

  return result; // {sucess: 1}
}
export async function unassignDriverFromJourney({ booking_jou_id, driver_id, token }) {
  const response = await fetch(`https://jat-uk.com/api/users/Unassignsubs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token}`,
    },
    body: new URLSearchParams({
      booking_jou_id,
      driver_id,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to unassign driver');
  }

  return result; // {sucess: 1}
}
// api.js
// src/api.js
export async function add_driver(formData, token) {
  console.log('Sending token:', token);
  let environment = 'portal';
  const response = await fetch(`https://jat-uk.com/api/users/add_driver/${environment}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(formData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Add Driver API failed.');
  }

  return result;
}
export async function get_driver_details(driverId, token) {
  console.log('Sending token:', token);

  const response = await fetch(`https://jat-uk.com/api/users/edit_driver_api/${driverId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Get Driver Details API failed.');
  }

  return result;
}
export async function get_supplier_details(driverId, token) {
  try {
    console.log('Sending token:', driverId);

    const response = await fetch(`https://jat-uk.com/api/users/api_edit_supplier/${driverId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || 'Get Supplier Details API failed.');
    }

    return result;
  } catch (error) {
    console.error('Error in get_supplier_details:', error.message);
    throw error;
  }
}

export async function save_supplier_driver(data, token) {
  const response = await fetch('https://jat-uk.com/api/users/api_save_supplier_driver', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok || result.status === false) {
    throw new Error(result.message || 'Failed to save driver');
  }
  return result;
}

export async function delete_driver(driverId, token) {
  console.log("Sending token:", token);

  const response = await fetch(
    `https://jat-uk.com/api/users/api_delete_supplier_driver/${driverId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json();

  if (!response.ok || result.status !== 200) {
    throw new Error(result.error || result.message || 'Failed to delete driver');
  }

  return result.data;
}


export async function checkBidJobs(booking_journey_id, token) {
  const response = await fetch(`https://jat-uk.com/api/users/check_bid_jobs/${booking_journey_id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to check bid jobs');
  }
  // result.data.assigned: true/false or 1/0 depending on your backend
  return result.data;
}
export async function checkBidJobsTomorrow(booking_journey_id, driver_id, token) {
  const response = await fetch(`https://jat-uk.com/api/users/checkBidJobsTomorrow/${booking_journey_id}/${driver_id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to check bid jobs');
  }

  return result.data; // Contains { assigned: 1/0, message?: 'Unassigned for current driver' }
}
export async function checkBidForCurrentDriver(booking_journey_id, driver_id, token) {
  const response = await fetch(`https://jat-uk.com/api/users/checkBidForCurrentDriver/${booking_journey_id}/${driver_id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to check bid jobs');
  }

  return result.data; // Contains { assigned: 1/0, message?: 'Unassigned for current driver' }
}
export async function forgot_password_request(email) {
  const response = await fetch('https://jat-uk.com/api/users/forgot_password_request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to send OTP');
  }

  return result.data;
}

export async function verify_otp_password(email, otp) {
  const response = await fetch('https://jat-uk.com/api/users/verify_otp_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to verify OTP');
  }

  return result.data;
}

export async function reset_password(email, newPassword, confirmPassword) {
  const response = await fetch('https://jat-uk.com/api/users/reset_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      new_password: newPassword,
      confirm_password: confirmPassword
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to reset password');
  }

  return result;
}
export async function verify_login(email, otp) {
  const response = await fetch('https://jat-uk.com/api/users/verify_login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to verify OTP');
  }

  return result.data;
}
export async function getJourneysOnDate(driverId, date, token) {
  const response = await fetch(
    `https://jat-uk.com/api/users/journeys_on_date/${driverId}/${date}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to fetch journeys');
  return result.data;
}
export async function getcountrycode(email, token) {
  const response = await fetch(`https://jat-uk.com/api/users/getcountrycode/${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to fetch country code');
  return result.data;
}
// api.js

export async function logoutStatus(email) {
  try {
    const response = await fetch('https://jat-uk.com/api/users/logout_status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization if needed
      },
      body: JSON.stringify({
        email,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Logout status update failed:', error);
    return { status: false, message: 'Network error' };
  }
}

export async function getAssignsOnDate(driverId, date, token) {
  const response = await fetch(
    `https://jat-uk.com/api/users/assigns_on_date/${driverId}/${date}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to fetch journeys');
  return result.data;
}

export async function saveSecretQuestions(driverId, questions, token) {
  const response = await fetch('https://jat-uk.com/api/users/save_secret_questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      driver_id: driverId,
      questions: questions, // [{question, answer}]
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to save secret questions');
  }
  return result.data;
}
export async function getSecretQuestions(driverId, token) {
  const response = await fetch(`https://jat-uk.com/api/users/get_secret_questions/${driverId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch secret questions');
  }
  return Array.isArray(result.data) ? result.data : [];
}
export async function updateUserSeen(driverId, userSeenArray, token) {
  const response = await fetch('https://jat-uk.com/api/users/update_user_seen', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      driver_id: driverId,
      user_seen: userSeenArray,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update user seen bookings');
  }
  return result.data;
}
export async function updateUserSeenScheduled(driverId, userSeenScheduledArray, token) {
  const response = await fetch('https://jat-uk.com/api/users/update_user_seen_scheduled', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      driver_id: driverId,
      user_seen_scheduled: userSeenScheduledArray,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update user seen scheduled bookings');
  }
  return result.data;
}
export async function getUserNotificationStates(driverId, token) {
  const response = await fetch('https://jat-uk.com/api/users/get_user_notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ driver_id: driverId }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch notification states');
  }

  const data = result.data || {};
  return {
    availableSeen: Array.isArray(data.available_seen) ? data.available_seen : [],
    scheduledSeen: Array.isArray(data.scheduled_seen) ? data.scheduled_seen : [],
  };
}





