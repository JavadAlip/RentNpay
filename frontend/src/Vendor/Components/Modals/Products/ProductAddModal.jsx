import React, { useEffect, useState } from 'react';

const defaultForm = {
  productName: '',
  type: 'Rental',
  category: 'Furniture',
  subCategory: 'Sofa',
  price: '',
  stock: '',
  status: 'Active',
  image: null,
};

const ProductAddModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialData = null,
}) => {
  const [form, setForm] = useState({
    ...defaultForm,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setForm({
        productName: initialData.productName || '',
        type: initialData.type || 'Rental',
        category: initialData.category || 'Furniture',
        subCategory: initialData.subCategory || 'Sofa',
        price: initialData.price || '',
        stock:
          initialData.stock === undefined || initialData.stock === null
            ? ''
            : String(initialData.stock),
        status: initialData.status || 'Active',
        image: null,
      });
    } else {
      setForm({ ...defaultForm });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setForm((prev) => ({ ...prev, image: files?.[0] || null }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            name="productName"
            value={form.productName}
            onChange={handleChange}
            placeholder="Product name"
            className="border rounded-lg px-3 py-2"
            required
          />
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option>Rental</option>
            <option>Sell</option>
          </select>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option>Furniture</option>
            <option>Electronics</option>
            <option>Appliances</option>
          </select>
          <select
            name="subCategory"
            value={form.subCategory}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option>Sofa</option>
            <option>Table</option>
            <option>Washing Machine</option>
            <option>Chair</option>
            <option>Bed</option>
            <option>TV</option>
          </select>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price (example: 1499/month or 24999)"
            type="text"
            className="border rounded-lg px-3 py-2"
            required
          />
          <input
            name="stock"
            value={form.stock}
            onChange={handleChange}
            placeholder="Stock"
            type="number"
            className="border rounded-lg px-3 py-2"
            required
          />
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option>Active</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
          <input
            name="image"
            onChange={handleChange}
            type="file"
            accept="image/*"
            className="border rounded-lg px-3 py-2 md:col-span-2"
            required={mode !== 'edit'}
          />

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
            >
              {mode === 'edit' ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductAddModal;
