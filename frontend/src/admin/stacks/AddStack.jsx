import React, { useState } from 'react';
import API from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AddStack = () => {
  const [form, setForm] = useState({
    material: '',
    unit: '',
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.material || !form.unit) {
      setError('All fields required!');
      return;
    }

    try {
      await API.post('/stacks/add', form);
      navigate('/admin/stacks');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Server Error');
    }
  };

  return (
    <div className="p-4 bg-white shadow-md max-w-md rounded">
      <h2 className="text-xl font-semibold mb-4">Add New Stack</h2>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Material Name</label>
          <input
            type="text"
            value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Unit (Ton, kWh, Pieces...)</label>
          <input
            type="text"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Stack
        </button>
      </form>
    </div>
  );
};

export default AddStack;
