import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/UserManagement.css';

const UserManagement = () => {
  const { getAllUsers, promoteUserToAdmin, demoteAdminToUser, suspendUser, unsuspendUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  // Load users on mount
  useEffect(() => {
    loadUsers();

    // Handle window resize for responsive design
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const userList = await getAllUsers();
      setUsers(userList);
    } catch (err) {
      setError('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && !u.suspended) ||
      (filterStatus === 'suspended' && u.suspended);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handlePromoteToAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to promote this user to admin?')) return;

    try {
      setActionLoading(true);
      setError('');
      await promoteUserToAdmin(userId);
      setSuccess('User promoted to admin successfully');
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to promote user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemoteToUser = async (userId) => {
    if (!window.confirm('Are you sure you want to demote this admin to user?')) return;

    try {
      setActionLoading(true);
      setError('');
      await demoteAdminToUser(userId);
      setSuccess('Admin demoted to user successfully');
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to demote admin: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;

    try {
      setActionLoading(true);
      setError('');
      await suspendUser(userId);
      setSuccess('User suspended successfully');
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to suspend user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to unsuspend this user?')) return;

    try {
      setActionLoading(true);
      setError('');
      await unsuspendUser(userId);
      setSuccess('User unsuspended successfully');
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to unsuspend user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="um-header">
        <div>
          <h2>User Management</h2>
          <p>Manage all users, roles, and account statuses</p>
        </div>
        <div className="um-stats">
          <div className="stat-card">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{users.filter(u => u.role === 'admin').length}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{users.filter(u => u.suspended).length}</div>
            <div className="stat-label">Suspended</div>
          </div>
        </div>
      </div>

      {error && <div className="um-alert error">{error}</div>}
      {success && <div className="um-alert success">{success}</div>}

      <div className="um-controls">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="filter-select">
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <button className="refresh-btn" onClick={loadUsers} disabled={actionLoading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className={user.suspended ? 'suspended-row' : ''}>
                  <td>
                    <div className="user-info">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.displayName?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <span>{user.displayName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${user.suspended ? 'suspended' : 'active'}`}>
                      {user.suspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td>
                    {user.createdAt ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn promote"
                        onClick={() => user.role === 'user' 
                          ? handlePromoteToAdmin(user.id)
                          : handleDemoteToUser(user.id)
                        }
                        disabled={actionLoading}
                        title={user.role === 'user' ? 'Promote to Admin' : 'Demote to User'}
                      >
                        {user.role === 'user' ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14"></path>
                              <path d="M5 12h14"></path>
                            </svg>
                            <span>Make Admin</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14"></path>
                            </svg>
                            <span>Demote</span>
                          </>
                        )}
                      </button>

                      <button
                        className="action-btn suspend"
                        onClick={() => user.suspended 
                          ? handleUnsuspendUser(user.id)
                          : handleSuspendUser(user.id)
                        }
                        disabled={actionLoading}
                        title={user.suspended ? 'Unsuspend User' : 'Suspend User'}
                      >
                        {user.suspended ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M8 12h8"></path>
                            </svg>
                            <span>Unsuspend</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="16"></line>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                            <span>Suspend</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Only show on mobile */}
      {isMobile && (
        <div className="users-list-mobile">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">No users found</div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} className={`user-card ${user.suspended ? 'suspended-row' : ''}`}>
                <div className="user-card-header">
                  <div className="user-card-avatar">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.displayName?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="user-card-info">
                    <div className="user-card-name">{user.displayName || 'Unknown'}</div>
                    <div className="user-card-email">{user.email}</div>
                  </div>
                </div>

                <div className="user-card-badges">
                  <span className={`role-badge role-${user.role}`}>
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                  <span className={`status-badge status-${user.suspended ? 'suspended' : 'active'}`}>
                    {user.suspended ? 'Suspended' : 'Active'}
                  </span>
                </div>

                <div className="user-card-row">
                  <span className="user-card-label">Joined</span>
                  <span className="user-card-value">
                    {user.createdAt ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="user-card-actions">
                  <button
                    className="action-btn promote"
                    onClick={() => user.role === 'user' 
                      ? handlePromoteToAdmin(user.id)
                      : handleDemoteToUser(user.id)
                    }
                    disabled={actionLoading}
                    title={user.role === 'user' ? 'Promote to Admin' : 'Demote to User'}
                  >
                    {user.role === 'user' ? 'Make Admin' : 'Demote'}
                  </button>

                  <button
                    className="action-btn suspend"
                    onClick={() => user.suspended 
                      ? handleUnsuspendUser(user.id)
                      : handleSuspendUser(user.id)
                    }
                    disabled={actionLoading}
                    title={user.suspended ? 'Unsuspend User' : 'Suspend User'}
                  >
                    {user.suspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="um-footer">
        <p>Showing {filteredUsers.length} of {users.length} users</p>
      </div>
    </div>
  );
};

export default UserManagement;
