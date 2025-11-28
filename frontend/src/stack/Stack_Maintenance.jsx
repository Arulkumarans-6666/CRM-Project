import { useEffect, useState } from 'react';
import API from '../utils/api';

const StackMaintenance = () => {
  const [stacks, setStacks] = useState([]);
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    used: '',
    buyRate: '',
    sellRate: ''
  });

  const [editId, setEditId] = useState(null);

  const fetchStacks = async () => {
    const res = await API.get('/stacks');
    setStacks(res.data);
  };

  useEffect(() => {
    fetchStacks();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await API.put(`/stacks/${editId}`, form);
    } else {
      await API.post('/stacks', form);
    }
    setForm({ name: '', quantity: '', used: '', buyRate: '', sellRate: '' });
    setEditId(null);
    fetchStacks();
  };

  const handleEdit = (s) => {
    setForm(s);
    setEditId(s._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this stack?')) {
      await API.delete(`/stacks/${id}`);
      fetchStacks();
    }
  };

  return (
    <div>
      <h3>Stack Maintenance</h3>
      <form onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
        <input name="quantity" type="number" value={form.quantity} onChange={handleChange} placeholder="Quantity" required />
        <input name="used" type="number" value={form.used} onChange={handleChange} placeholder="Used" required />
        <input name="buyRate" type="number" value={form.buyRate} onChange={handleChange} placeholder="Buy Rate" required />
        <input name="sellRate" type="number" value={form.sellRate} onChange={handleChange} placeholder="Sell Rate" required />
        <button type="submit">{editId ? 'Update' : 'Add'} Stack</button>
        {editId && <button onClick={() => {
          setEditId(null);
          setForm({ name: '', quantity: '', used: '', buyRate: '', sellRate: '' });
        }}>Cancel</button>}
      </form>

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Name</th>
            <th>Qty</th>
            <th>Used</th>
            <th>Buy Rate</th>
            <th>Sell Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stacks.map(s => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.quantity}</td>
              <td>{s.used}</td>
              <td>{s.buyRate}</td>
              <td>{s.sellRate}</td>
              <td>
                <button onClick={() => handleEdit(s)}>Edit</button>
                <button onClick={() => handleDelete(s._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StackMaintenance;
