import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://127.0.0.1:8000';

// アイコンコンポーネント
const EditIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>;
const DeleteIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>;

function App() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSite, setNewSite] = useState({ title: '', url: '', category_id: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSite, setEditingSite] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = () => {
    axios.get(`${API_URL}/api/categories`)
      .then(res => setCategories(res.data))
      .catch(err => console.error("Error fetching data:", err));
  };

  useEffect(() => { fetchData(); }, []);

  // --- カテゴリ関連のハンドラ ---
  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    axios.post(`${API_URL}/api/categories`, { name: newCategoryName })
      .then(() => {
        setNewCategoryName('');
        fetchData();
      });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) {
        setEditingCategory(null);
        return;
    };
    axios.put(`${API_URL}/api/categories/${editingCategory.id}`, { name: editingCategory.name })
      .then(() => {
        setEditingCategory(null);
        fetchData();
      });
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('このカテゴリと、含まれる全てのサイトを削除します。よろしいですか？')) {
      axios.delete(`${API_URL}/api/categories/${categoryId}`).then(fetchData);
    }
  };

  // --- サイト関連のハンドラ ---
  const handleCreateSite = (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/api/sites`, { ...newSite, category_id: parseInt(newSite.category_id) })
      .then(() => {
        setNewSite({ title: '', url: '', category_id: '' });
        fetchData();
      });
  };

  const handleDeleteSite = (e, siteId) => {
    e.preventDefault(); // リンクのクリックイベントを防ぐ
    if (window.confirm('このサイトを削除しますか？')) {
      axios.delete(`${API_URL}/api/sites/${siteId}`).then(fetchData);
    }
  };

  const handleUpdateSite = () => {
    if (!editingSite || !editingSite.title.trim()) {
        setEditingSite(null);
        return;
    }
    axios.put(`${API_URL}/api/sites/${editingSite.id}`, { title: editingSite.title })
      .then(() => {
        setEditingSite(null);
        fetchData();
      });
  };

  // --- 検索機能 ---
  const filteredCategories = categories.map(category => ({
    ...category,
    sites: category.sites.filter(site => 
      (site.title && site.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (site.url && site.url.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    category.sites.length > 0
  );

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>サイト管理</h2>
        <div className="form-section">
          <h3>新しいカテゴリを追加</h3>
          <form onSubmit={handleCreateCategory}>
            <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="カテゴリ名（例: 仕事用）" required />
            <button type="submit" className="primary-btn">カテゴリ作成</button>
          </form>
        </div>
        <div className="form-section">
          <h3>新しいサイトを追加</h3>
          <form onSubmit={handleCreateSite}>
            <input type="text" value={newSite.title} onChange={e => setNewSite({...newSite, title: e.target.value})} placeholder="サイト名 (空欄で自動取得)" />
            <input type="url" value={newSite.url} onChange={e => setNewSite({...newSite, url: e.target.value})} placeholder="URL" required />
            <select value={newSite.category_id} onChange={e => setNewSite({...newSite, category_id: e.target.value})} required>
              <option value="" disabled>カテゴリを選択</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <button type="submit" className="primary-btn">サイト追加</button>
          </form>
        </div>
      </aside>
      <main className="main-content">
        <div className="main-header">
          <h1>ダッシュボード</h1>
          <input type="text" className="search-bar" placeholder="カテゴリやサイトを検索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="dashboard">
          {filteredCategories.map(category => (
            <div key={category.id} className="category-card">
              <div className="category-header">
                {editingCategory && editingCategory.id === category.id ? (
                  <input type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} onBlur={handleUpdateCategory} onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()} autoFocus />
                ) : (
                  <h2 onDoubleClick={() => setEditingCategory(category)} title="ダブルクリックで編集">{category.name}</h2>
                )}
                <div className="category-actions">
                  <button onClick={() => handleDeleteCategory(category.id)} title="カテゴリを削除"><DeleteIcon /></button>
                </div>
              </div>
              <ul className="site-list">
                {category.sites.map(site => (
                  <li key={site.id} className="site-item">
                    {editingSite && editingSite.id === site.id ? (
                      <>
                        <img src={site.favicon_url || 'https://placehold.co/32x32/e9ecef/6c757d?text=?'} alt="" className="site-favicon" />
                        <div className="site-title-container">
                          <input type="text" value={editingSite.title} onChange={e => setEditingSite({...editingSite, title: e.target.value})} onBlur={handleUpdateSite} onKeyDown={e => e.key === 'Enter' && handleUpdateSite()} autoFocus />
                        </div>
                      </>
                    ) : (
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="site-link-area">
                        <img src={site.favicon_url || 'https://placehold.co/32x32/e9ecef/6c757d?text=?'} alt="" className="site-favicon" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/32x32/e9ecef/6c757d?text=?'; }}/>
                        <span>{site.title}</span>
                      </a>
                    )}
                    <div className="site-actions">
                       <button onClick={(e) => { e.preventDefault(); setEditingSite(site); }} title="サイト名を編集"><EditIcon /></button>
                       <button onClick={(e) => handleDeleteSite(e, site.id)} title="サイトを削除"><DeleteIcon /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
