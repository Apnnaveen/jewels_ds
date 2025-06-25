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
  console.log('Available jobs data:', data);
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
export async function upcoming_journey_details(driver_id, token) {
  const response = await fetch(`http://jewels.com/api/users/upcoming_journeys/${driver_id}`, {
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
  const response = await fetch(`http://jewels.com/api/users/tomorrow_journeys/${driver_id}`, {
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
  const response = await fetch(`http://jewels.com/api/users/completed_journey_details/${driver_id}`, {
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
  const response = await fetch('http://jewels.com/api/users/confirm_availability', {
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
    throw new Error(result.message || 'Failed to confirm availability');
  }
  return result.data;
}
// Decline job API
export async function declineJob({ booking_journey_id, driver_id, token }) {
  const response = await fetch(`http://jewels.com/api/users/declined/${booking_journey_id}/${driver_id}`,
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
  const response = await fetch(`http://jewels.com/api/users/update_icon_data/${driver_id}/${booking_journey_id}/${status_code}`,
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
  const response = await fetch(`http://jewels.com/api/users/get_all_cars/`, {
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
  const response = await fetch('http://jewels.com/api/users/acknowledge_status', {
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
    `http://jewels.com/api/users/withdraw_job/${driver_id}/${booking_journey_id}`,
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
    `http://jewels.com/api/users/get_supplier_mapped_drivers/${supplier_id}/${booking_jou_id}`,
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
  const response = await fetch(`http://jewels.com/api/users/assignedsubs`, {
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
  const response = await fetch(`http://jewels.com/api/users/Unassignsubs`, {
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
  const response = await fetch(`http://jewels.com/api/users/add_driver/${environment}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(formData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Add Driver API failed.');
  }

  return result;
}
export async function get_driver_details(driverId, token) {
  console.log('Sending token:', token);

  const response = await fetch(`http://jewels.com/api/users/edit_driver_api/${driverId}`, {
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

    const response = await fetch(`http://jewels.com/api/users/api_edit_supplier/${driverId}`, {
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
    const response = await fetch('http://jewels.com/api/users/api_save_supplier_driver', {
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
  const response = await fetch(`http://jewels.com/api/users/api_delete_supplier_driver/${driverId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json(); // <== This fails if response is HTML

  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to delete driver');
  }

  return result;
}


