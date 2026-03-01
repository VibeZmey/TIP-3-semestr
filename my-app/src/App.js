import React, { useEffect, useState } from 'react';
import { api } from './api';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', description: '', price: '', quantity: '' });
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const data = await api.getProducts();
    setProducts(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.updateProduct(editing, form);
    else await api.createProduct(form);

    setForm({ name: '', category: '', description: '', price: '', quantity: '' });
    setEditing(null);
    setModalOpen(false);

    loadProducts();
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, category: p.category, description: p.description, price: p.price, quantity: p.quantity });
    setEditing(p.id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    await api.deleteProduct(id);
    loadProducts();
  };

  const openCreate = () => {
    setForm({ name: '', category: '', description: '', price: '', quantity: '' });
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <div className="app">

      <header className="header">
        <h1>Интернет-магазин</h1>
        <button className="btn btn-primary" onClick={openCreate}>Добавить товар</button>
      </header>

      <div className="grid">
        {products.map(p => (
          <div key={p.id} className="card">
            <h3>{p.name}</h3>
            <p className="category">{p.category}</p>
            <p>{p.description}</p>
            <p className="price">{p.price} ₽</p>
            <p>На складе: {p.quantity}</p>
            <div className="actions">
              <button className="btn" onClick={() => handleEdit(p)}>Изменить</button>
              <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Удалить</button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Редактирование' : 'Новый товар'}</h2>
            <form onSubmit={handleSubmit}>

              <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <input placeholder="Категория" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
              <input placeholder="Описание" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              <input type="number" placeholder="Цена" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
              <input type="number" placeholder="Количество" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Сохранить</button>

              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;