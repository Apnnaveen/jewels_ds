import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './css/DeleteAccount.css';

const DeleteAccount = ({ onDelete }) => {
  const location = useLocation();
  const user = location.state?.user;
  const [showModal, setShowModal] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`http://jewels.com/api/users/delete_user/${user.driver_id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (response.ok) {
        if (onDelete) onDelete();
        alert('Account deleted successfully.');
      } else {
        alert('Failed to delete account.');
      }
    } catch (error) {
      alert('An error occurred while deleting your account.');
    } finally {
      setShowModal(false);
    }
  };

  return (
    <>
      <button className="delete-button" onClick={() => setShowModal(true)}>
        Delete Account
      </button>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="warning-icon">⚠️</div>
            <h2>Delete Account?</h2>
            <p>This action is permanent and cannot be undone.</p>
            <p>Are you sure you want to proceed?</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="confirm-delete" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteAccount;
