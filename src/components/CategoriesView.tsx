/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../contexts/POSContext';
import { 
  Tags, 
  Plus, 
  Edit, 
  X, 
  Search,
  CheckCircle2
} from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = usePOS();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryDescInput, setCategoryDescInput] = useState('');

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryNameInput.trim()) {
      alert("Category name is required.");
      return;
    }

    const payload = {
      name: categoryNameInput.trim(),
      description: categoryDescInput.trim() || undefined
    };

    if (editingCategoryId) {
      await updateCategory(editingCategoryId, payload);
      setEditingCategoryId(null);
    } else {
      await addCategory(payload);
    }

    setCategoryNameInput('');
    setCategoryDescInput('');
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 p-6 md:p-8 bg-slate-50 flex flex-col h-full overflow-y-auto select-none">
      
      {/* Title Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Tags className="h-6 w-6 text-primary" />
            <span>Category Manager</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Define custom departments and categories to classify, manage, and filter inventory items efficiently.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-primary shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Categories List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center justify-between">
            <span>Defined Categories ({filteredCategories.length})</span>
          </h3>

          {filteredCategories.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-sans">
              <Tags className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No categories found.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting search or create a new category on the right.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold font-mono border-b border-slate-200">
                    <th className="p-3 w-16">Visual Tag</th>
                    <th className="p-3">Category Name</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Assigned Products</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map(cat => {
                    const prodCount = products.filter(p => p.category === cat.name).length;
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center font-black text-primary uppercase font-mono shadow-inner text-xs">
                            {cat.name.slice(0, 2)}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 text-sm">{cat.name}</span>
                        </td>
                        <td className="p-3 text-slate-500 max-w-[200px] truncate" title={cat.description}>
                          {cat.description || <span className="italic text-slate-300">No description provided</span>}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono ${
                            prodCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {prodCount} Items Stored
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCategoryId(cat.id);
                                setCategoryNameInput(cat.name);
                                setCategoryDescInput(cat.description || '');
                              }}
                              className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete category: ${cat.name}? Any products currently assigned to this category will remain, but you may want to reassign them.`)) {
                                  deleteCategory(cat.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Add/Edit Category Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-1.5 rounded-lg ${editingCategoryId ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-primary/10 text-primary'}`}>
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
              {editingCategoryId ? '✍️ Edit Category' : '➕ Add Category'}
            </h3>
          </div>

          <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Snacks, Fresh Produce, Household"
                value={categoryNameInput}
                onChange={(e) => setCategoryNameInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                Description / Purpose
              </label>
              <textarea
                placeholder="Brief explanation of items categorized here..."
                value={categoryDescInput}
                onChange={(e) => setCategoryDescInput(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white transition-all font-sans resize-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategoryId(null);
                    setCategoryNameInput('');
                    setCategoryDescInput('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2.5 bg-primary hover:bg-sage-dark text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {editingCategoryId ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
