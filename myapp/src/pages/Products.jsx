import React, { useState, useEffect } from 'react';
import { productsApi } from '../api';

function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ title: '', category: '', description: '', price: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAll();
      setProducts(response.data);
    } catch (err) {
      setError('Failed to load products');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await productsApi.update(editingId, form);
        setEditingId(null);
      } else {
        await productsApi.create(form);
      }
      setForm({ title: '', category: '', description: '', price: '' });
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      category: product.category,
      description: product.description,
      price: product.price,
    });
  };

  const handleDelete = async (id) => {
    try {
      await productsApi.delete(id);
      loadProducts();
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: '', category: '', description: '', price: '' });
  };

  return (
    <div className="container products-page">
      <h2>Products</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="product-form">
        <h3>{editingId ? 'Edit Product' : 'Create Product'}</h3>
        <div className="form-row">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="form-row">
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <div className="form-row">
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-row">
          <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </div>
        <div className="form-actions">
          <button type="submit">{editingId ? 'Update' : 'Create'}</button>
          {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {products.length === 0 ? (
        <div className="empty-state">No products yet. Create one above.</div>
      ) : (
        <ul className="products-list">
          {products.map((product) => (
            <li key={product.id}>
              <h4>{product.title}</h4>
              <p><strong>Category:</strong> {product.category || '—'}</p>
              <p><strong>Description:</strong> {product.description || '—'}</p>
              <p><strong>Price:</strong> ${product.price}</p>
              <div className="product-actions">
                <button onClick={() => handleEdit(product)}>Edit</button>
                <button onClick={() => handleDelete(product.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Products;