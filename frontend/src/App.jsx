import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // App.cssをインポート

const API_URL = 'http://127.0.0.1:8000';

function App() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSite, setNewSite] = useState({ title: '', url: '', category_id: '' });

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
    if (!newCategoryName.trim()) return; // 空の場合は何もしない
    axios.post(`${API_URL}/api/categories`, { name: newCategoryName })
      .then(() => {
        setNewCategoryName('');
        fetchData(); // 再取得してリストを更新
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

  const handleLaunchAll = (sites) => {
    sites.forEach(site => window.open(site.url, '_blank'));
  };

  return (
    <div className="App">
      <h1>タブ管理ダッシュボード</h1>

      {/* --- カテゴリ・サイト登録フォーム --- */}
      <div className="form-section">
        <h3>新しいカテゴリを追加</h3>
        <form onSubmit={handleCreateCategory}>
          <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="カテゴリ名（例: 仕事用, 勉強用）" required />
          <button type="submit">カテゴリ作成</button>
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
          <button type="submit">サイト追加</button>
        </form>
      </div>

      {/* --- ダッシュボード表示 --- */}
      <div className="dashboard">
        {categories.map(category => (
          <div key={category.id} className="category-card">
            <h2>{category.name}</h2>
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
    </div>
  );
}

export default App;