import React, { useState, useEffect } from 'react';
import { usersApi } from '../api';

function Users() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', role: 'user' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersApi.getAll();
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setForm({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await usersApi.update(editingUser, form);
      setEditingUser(null);
      setForm({ email: '', first_name: '', last_name: '', role: 'user' });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to block this user?')) return;
    try {
      await usersApi.delete(id);
      loadUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setForm({ email: '', first_name: '', last_name: '', role: 'user' });
  };

  return (
    <div className="container">
      <h2>Users Management</h2>
      {error && <p className="error">{error}</p>}
      <ul className="products-list">
        {users.map((user) => (
          <li key={user.id}>
            {editingUser === user.id ? (
              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-row">
                  <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-row">
                  <input placeholder="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                </div>
                <div className="form-row">
                  <input placeholder="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </div>
                <div className="form-row">
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="user">User</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit">Save</button>
                  <button type="button" onClick={cancelEdit}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <h4>{user.first_name} {user.last_name}</h4>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <div className="product-actions">
                  <button onClick={() => handleEdit(user)}>Edit</button>
                  <button onClick={() => handleDelete(user.id)}>Block</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Users;