import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://127.0.0.1:8000';

// アイコンコンポーネント
const EditIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
);
const DeleteIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
);

function App() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSite, setNewSite] = useState({ title: '', url: '', category_id: '' });
  const [editingCategory, setEditingCategory] = useState(null); // { id, name }
  const [showPopupNotice, setShowPopupNotice] = useState(false);

  // --- データ取得 ---
  const fetchData = () => {
    axios.get(`${API_URL}/api/categories`)
      .then(res => setCategories(res.data))
      .catch(err => console.error("Error fetching data:", err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- イベントハンドラ ---
  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    axios.post(`${API_URL}/api/categories`, { name: newCategoryName })
      .then(() => {
        setNewCategoryName('');
        fetchData();
      });
  };

  const handleCreateSite = (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/api/sites`, { ...newSite, category_id: parseInt(newSite.category_id) })
      .then(() => {
        setNewSite({ title: '', url: '', category_id: '' });
        fetchData();
      });
  };

  const handleDeleteSite = (siteId) => {
    axios.delete(`${API_URL}/api/sites/${siteId}`)
      .then(() => fetchData());
  };
  
  const handleEditCategory = (category) => {
    setEditingCategory({ ...category });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    axios.put(`${API_URL}/api/categories/${editingCategory.id}`, { name: editingCategory.name })
      .then(() => {
        setEditingCategory(null);
        fetchData();
      });
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('このカテゴリと、含まれる全てのサイトを削除します。よろしいですか？')) {
      axios.delete(`${API_URL}/api/categories/${categoryId}`)
        .then(() => fetchData());
    }
  };

  const handleLaunchAll = (sites) => {
    if (sites.length > 1) {
      setShowPopupNotice(true);
      setTimeout(() => setShowPopupNotice(false), 5000); // 5秒後に通知を消す
    }
    sites.forEach(site => window.open(site.url, '_blank'));
  };

  return (
    <div className="app-container">
      {/* --- サイドバー --- */}
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
            <input type="text" value={newSite.title} onChange={e => setNewSite({...newSite, title: e.target.value})} placeholder="サイト名" required />
            <input type="url" value={newSite.url} onChange={e => setNewSite({...newSite, url: e.target.value})} placeholder="URL" required />
            <select value={newSite.category_id} onChange={e => setNewSite({...newSite, category_id: e.target.value})} required>
              <option value="" disabled>カテゴリを選択</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <button type="submit" className="primary-btn">サイト追加</button>
          </form>
        </div>
      </aside>

      {/* --- メインコンテンツ --- */}
      <main className="main-content">
        <h1>ダッシュボード</h1>
        <div className="dashboard">
          {categories.map(category => (
            <div key={category.id} className="category-card">
              <div className="category-header">
                {editingCategory && editingCategory.id === category.id ? (
                  <input 
                    type="text" 
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    onBlur={handleUpdateCategory}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                    autoFocus
                  />
                ) : (
                  <h2>{category.name}</h2>
                )}
                <div className="category-actions">
                  <button onClick={() => handleEditCategory(category)}><EditIcon /></button>
                  <button onClick={() => handleDeleteCategory(category.id)}><DeleteIcon /></button>
                </div>
              </div>
              <button onClick={() => handleLaunchAll(category.sites)} className="launch-btn">このカテゴリをすべて開く</button>
              <ul className="site-list">
                {category.sites.map(site => (
                  <li key={site.id} className="site-item">
                    <a href={site.url} target="_blank" rel="noopener noreferrer">{site.title}</a>
                    <button onClick={() => handleDeleteSite(site.id)} className="delete-btn">×</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
         {showPopupNotice && (
          <div className="popup-notice">
            ブラウザによっては、ポップアップがブロックされる場合があります。その際は、このサイトのポップアップを許可してください。
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
