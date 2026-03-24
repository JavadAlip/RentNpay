// import { useState, useEffect } from 'react';
// import { api } from '../api/axios';

// const Categories = () => {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [editing, setEditing] = useState(null);
//   const [name, setName] = useState('');
//   const [showForm, setShowForm] = useState(false);
//   const [formName, setFormName] = useState('');

//   const fetchCategories = () => {
//     api.get('/api/categories').then((r) => setCategories(r.data || [])).catch(() => []).finally(() => setLoading(false));
//   };

//   useEffect(() => fetchCategories(), []);

//   const create = async (e) => {
//     e.preventDefault();
//     if (!formName.trim()) return;
//     await api.post('/api/categories', { name: formName.trim() });
//     setFormName('');
//     setShowForm(false);
//     fetchCategories();
//   };

//   const update = async (e) => {
//     e.preventDefault();
//     if (!editing || !name.trim()) return;
//     await api.put(`/api/categories/${editing._id}`, { name: name.trim() });
//     setEditing(null);
//     setName('');
//     fetchCategories();
//   };

//   const remove = (cat) => {
//     if (!window.confirm(`Delete "${cat.name}"?`)) return;
//     api.delete(`/api/categories/${cat._id}`).then(() => fetchCategories()).catch(() => {});
//   };

//   if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
//         <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700">Create category</button>
//       </div>
//       {showForm && (
//         <form onSubmit={create} className="mb-6 flex gap-2">
//           <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Category name" className="px-4 py-2 border rounded-lg flex-1" />
//           <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Add</button>
//           <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
//         </form>
//       )}
//       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
//               <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {categories.map((c) => (
//               <tr key={c._id}>
//                 {editing?._id === c._id ? (
//                   <td colSpan={3}>
//                     <form onSubmit={update} className="flex gap-2 p-2">
//                       <input value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2 border rounded-lg flex-1" />
//                       <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Save</button>
//                       <button type="button" onClick={() => { setEditing(null); setName(''); }} className="px-4 py-2 border rounded-lg">Cancel</button>
//                     </form>
//                   </td>
//                 ) : (
//                   <>
//                     <td className="px-4 py-3 font-medium">{c.name}</td>
//                     <td className="px-4 py-3 text-gray-500">{c.slug}</td>
//                     <td className="px-4 py-3 text-right">
//                       <button onClick={() => { setEditing(c); setName(c.name); }} className="text-primary hover:underline mr-3">Edit</button>
//                       <button onClick={() => remove(c)} className="text-red-600 hover:underline">Delete</button>
//                     </td>
//                   </>
//                 )}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {categories.length === 0 && <p className="p-8 text-center text-gray-500">No categories.</p>}
//       </div>
//     </div>
//   );
// };

// export default Categories;

'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearCategoryError,
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  getCategories,
  getSubCategories,
} from '@/redux/slices/categorySlice';
import { toast } from 'react-toastify';

const Categories = () => {
  const dispatch = useDispatch();
  const { categories, subCategories, categoriesLoading, subCategoriesLoading, error } =
    useSelector((s) => s.category);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);
  const [catSubmitting, setCatSubmitting] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [showSubForm, setShowSubForm] = useState(false);
  const [subName, setSubName] = useState('');
  const [subImage, setSubImage] = useState(null);
  const [subSubmitting, setSubSubmitting] = useState(false);

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedCategoryId && categories.length) {
      setSelectedCategoryId(categories[0]._id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (!selectedCategoryId) return;
    dispatch(getSubCategories(selectedCategoryId));
  }, [dispatch, selectedCategoryId]);

  useEffect(() => {
    if (error) toast.error(error);
    return () => {
      dispatch(clearCategoryError());
    };
  }, [error, dispatch]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim() || !categorySlug.trim() || !categoryImage) {
      toast.error('Category name, slug and image are required.');
      return;
    }

    const data = new FormData();
    data.append('name', categoryName.trim());
    data.append('slug', categorySlug.trim());
    data.append('image', categoryImage);

    setCatSubmitting(true);
    const result = await dispatch(createCategory(data));
    setCatSubmitting(false);

    if (createCategory.fulfilled.match(result)) {
      toast.success('Category created');
      setCategoryName('');
      setCategorySlug('');
      setCategoryImage(null);
      setShowCategoryForm(false);
      dispatch(getCategories());
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}" and its subcategories?`)) return;
    const result = await dispatch(deleteCategory(cat._id));
    if (deleteCategory.fulfilled.match(result)) {
      toast.success('Category deleted');
      dispatch(getCategories());
      if (selectedCategoryId === cat._id) {
        setSelectedCategoryId('');
      }
    }
  };

  const handleCreateSubCategory = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      toast.error('Please select a category first.');
      return;
    }
    if (!subName.trim()) {
      toast.error('Subcategory name is required.');
      return;
    }

    const data = new FormData();
    data.append('name', subName.trim());
    data.append('categoryId', selectedCategoryId);
    if (subImage) data.append('image', subImage);

    setSubSubmitting(true);
    const result = await dispatch(createSubCategory(data));
    setSubSubmitting(false);

    if (createSubCategory.fulfilled.match(result)) {
      toast.success('Subcategory created');
      setSubName('');
      setSubImage(null);
      setShowSubForm(false);
      dispatch(getSubCategories(selectedCategoryId));
    }
  };

  const handleDeleteSubCategory = async (sub) => {
    if (!window.confirm(`Delete "${sub.name}"?`)) return;
    const result = await dispatch(deleteSubCategory(sub._id));
    if (deleteSubCategory.fulfilled.match(result)) {
      toast.success('Subcategory deleted');
      dispatch(getSubCategories(selectedCategoryId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Categories</h1>
          <button
            type="button"
            onClick={() => setShowCategoryForm((p) => !p)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm"
          >
            {showCategoryForm ? 'Close' : 'Add Category'}
          </button>
        </div>

        {showCategoryForm && (
          <form
            onSubmit={handleCreateCategory}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5"
          >
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Category name"
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <input
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              placeholder="Category slug"
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCategoryImage(e.target.files?.[0] || null)}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <button
              type="submit"
              disabled={catSubmitting}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm disabled:opacity-60"
            >
              {catSubmitting ? 'Saving...' : 'Create'}
            </button>
          </form>
        )}

        {categoriesLoading ? (
          <p className="text-sm text-gray-600">Loading categories...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-gray-500">
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Slug</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-gray-800">{c.name}</td>
                    <td className="px-4 py-2 text-gray-600">{c.slug}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId(c._id)}
                        className="text-blue-600 hover:underline mr-3"
                      >
                        View Subcategories
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-gray-500 text-sm"
                    >
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Subcategories
            {selectedCategoryId
              ? ` (${categories.find((c) => c._id === selectedCategoryId)?.name || ''})`
              : ''}
          </h2>
          <button
            type="button"
            onClick={() => setShowSubForm((p) => !p)}
            disabled={!selectedCategoryId}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {showSubForm ? 'Close' : 'Add Subcategory'}
          </button>
        </div>

        {!selectedCategoryId ? (
          <p className="text-sm text-gray-500">Select a category first.</p>
        ) : (
          <>
            {showSubForm && (
              <form
                onSubmit={handleCreateSubCategory}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5"
              >
                <input
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="Subcategory name"
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSubImage(e.target.files?.[0] || null)}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  type="submit"
                  disabled={subSubmitting}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  {subSubmitting ? 'Saving...' : 'Create'}
                </button>
              </form>
            )}

            {subCategoriesLoading ? (
              <p className="text-sm text-gray-600">Loading subcategories...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-gray-500">
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Image</th>
                      <th className="px-4 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subCategories.map((s) => (
                      <tr key={s._id} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-gray-800">{s.name}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {s.image ? 'Yes' : 'No'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSubCategory(s)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {subCategories.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-6 text-center text-gray-500 text-sm"
                        >
                          No subcategories found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Categories;
