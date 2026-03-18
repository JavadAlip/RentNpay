import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axios';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    pricePerDay: '',
    category: '',
    brand: '',
    condition: 'good',
    availability: 'available',
    images: []
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) { setLoading(false); return; }
    api.get(`/api/products/${id}`).then((r) => {
      setForm({
        title: r.data.title || '',
        description: r.data.description || '',
        pricePerDay: r.data.pricePerDay?.toString() || '',
        category: r.data.category?._id || r.data.category || '',
        brand: r.data.brand || '',
        condition: r.data.condition || 'good',
        availability: r.data.availability || 'available',
        images: r.data.images || []
      });
    }).catch(() => navigate('/products')).finally(() => setLoading(false));
  }, [id, isNew, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('pricePerDay', form.pricePerDay);
    fd.append('category', form.category);
    fd.append('brand', form.brand);
    fd.append('condition', form.condition);
    fd.append('availability', form.availability);
    files.forEach((file) => fd.append('images', file));

    try {
      const token = localStorage.getItem('rentpay_token');
      if (isNew) {
        await api.post('/api/products', fd, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
      } else {
        await api.put(`/api/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
      }
      navigate('/products');
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isNew ? 'Add product' : 'Edit product'}</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full px-4 py-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price per day</label>
          <input name="pricePerDay" type="number" step="0.01" value={form.pricePerDay} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required>
            <option value="">Select</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <input name="brand" value={form.brand} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
          <select name="condition" value={form.condition} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
            <option value="new">new</option>
            <option value="like-new">like-new</option>
            <option value="good">good</option>
            <option value="fair">fair</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
          <select name="availability" value={form.availability} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
            <option value="available">available</option>
            <option value="unavailable">unavailable</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Images (new)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="w-full px-4 py-2 border rounded-lg" />
          {form.images?.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {form.images.map((src, i) => (
                <img key={i} src={src.startsWith('http') ? src : '' + src} alt="" className="w-16 h-16 object-cover rounded" onError={(e) => { e.target.src = 'https://via.placeholder.com/64'; }} />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => navigate('/products')} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default ProductEdit;
