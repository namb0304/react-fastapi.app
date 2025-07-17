import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './App.css';

const API_URL = 'http://127.0.0.1:8000';

// --- アイコンコンポーネント ---
const EditIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>;
const DeleteIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>;
const GrabHandleIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 9H4v2h16V9zM4 15h16v-2H4v2z"></path></svg>;

// --- ドラッグ可能なサイトアイテムコンポーネント ---
function SiteItem({ site, onDelete, onUpdateTitle }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(site.title);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `site-${site.id}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const handleTitleUpdate = () => {
    setIsEditing(false);
    if (title.trim() && title !== site.title) {
      onUpdateTitle(site.id, title);
    } else {
      setTitle(site.title);
    }
  };

  return (
    <li className={`site-item ${isDragging ? 'dragging' : ''}`} ref={setNodeRef} style={style} {...attributes}>
      <span className="grab-handle" {...listeners}><GrabHandleIcon /></span>
      {isEditing ? (
        <div className="site-link-area">
            <img src={site.favicon_url || 'https://placehold.co/32x32/e9ecef/6c757d?text=?'} alt="" className="site-favicon" />
            <div className="site-title-container">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} onBlur={handleTitleUpdate} onKeyDown={e => e.key === 'Enter' && handleTitleUpdate()} autoFocus onClick={e => e.preventDefault()} />
            </div>
        </div>
      ) : (
        <a href={site.url} target="_blank" rel="noopener noreferrer" className="site-link-area">
            <img src={site.favicon_url || 'https://placehold.co/32x32/e9ecef/6c757d?text=?'} alt="" className="site-favicon" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/32x32/e9ecef/6c757d?text=?'; }}/>
            <span>{site.title}</span>
        </a>
      )}
      <div className="site-actions">
          <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setIsEditing(true)} title="サイト名を編集"><EditIcon /></button>
          <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => onDelete(e, site.id)} title="サイトを削除"><DeleteIcon /></button>
      </div>
    </li>
  );
}

// --- ドラッグ可能なカテゴリカードコンポーネント ---
function CategoryCard({ category, children, onDeleteCategory, onUpdateCategory }) {
   const [isEditing, setIsEditing] = useState(false);
   const [name, setName] = useState(category.name);
   const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `category-${category.id}` });
   const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };
  
  const handleNameUpdate = () => {
    setIsEditing(false);
    if (name.trim() && name !== category.name) {
        onUpdateCategory(category.id, name);
    } else {
        setName(category.name);
    }
  };

  return (
     <div className={`category-card ${isDragging ? 'dragging' : ''}`} ref={setNodeRef} style={style} {...attributes}>
        <div className="category-header">
            {isEditing ? (
                 <input type="text" value={name} onChange={e => setName(e.target.value)} onBlur={handleNameUpdate} onKeyDown={e => e.key === 'Enter' && handleNameUpdate()} autoFocus onClick={(e) => e.stopPropagation()} />
            ) : (
                <h2 onDoubleClick={() => setIsEditing(true)} title="ダブルクリックで編集">{category.name}</h2>
            )}
          <div className="category-actions">
            <button className="grab-handle" {...listeners}><GrabHandleIcon /></button>
            <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => onDeleteCategory(e, category.id)} title="カテゴリを削除"><DeleteIcon /></button>
          </div>
        </div>
        {children}
     </div>
  );
}

function App() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSite, setNewSite] = useState({ title: '', url: '', category_id: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const fetchData = () => {
    axios.get(`${API_URL}/api/categories`)
      .then(res => setCategories(res.data))
      .catch(err => console.error("Error fetching data:", err));
  };

  useEffect(() => { fetchData(); }, []);

  // --- ハンドラ ---
  const handleCreateCategory = e => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    axios.post(`${API_URL}/api/categories`, { name: newCategoryName }).then(() => {
      setNewCategoryName('');
      fetchData();
    });
  };

  const handleCreateSite = e => {
    e.preventDefault();
    axios.post(`${API_URL}/api/sites`, { ...newSite, category_id: parseInt(newSite.category_id) }).then(() => {
      setNewSite({ title: '', url: '', category_id: '' });
      fetchData();
    });
  };

  const handleDeleteSite = (e, siteId) => {
    e.stopPropagation();
    if (window.confirm('このサイトを削除しますか？')) {
      axios.delete(`${API_URL}/api/sites/${siteId}`).then(fetchData);
    }
  };
  
  const handleUpdateSiteTitle = (siteId, newTitle) => {
    axios.put(`${API_URL}/api/sites/${siteId}`, { title: newTitle }).then(fetchData);
  };

  const handleDeleteCategory = (e, categoryId) => {
    e.stopPropagation();
    if (window.confirm('このカテゴリと含まれる全てのサイトを削除します。よろしいですか？')) {
      axios.delete(`${API_URL}/api/categories/${categoryId}`).then(fetchData);
    }
  };
  
  const handleUpdateCategory = (categoryId, newName) => {
    axios.put(`${API_URL}/api/categories/${categoryId}`, { name: newName }).then(fetchData);
  };
  
  function getContainerId(id) {
    if (typeof id === 'string' && id.startsWith('category-')) {
      return id;
    }
    for (const category of categories) {
      if (category.sites.some(s => `site-${s.id}` === id)) {
        return `category-${category.id}`;
      }
    }
    return null;
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // カテゴリの並び替え
    if (activeId.startsWith('category-') && overId.startsWith('category-')) {
      setCategories((items) => {
        const oldIndex = items.findIndex(item => `category-${item.id}` === activeId);
        const newIndex = items.findIndex(item => `category-${item.id}` === overId);
        if (oldIndex === -1 || newIndex === -1) return items;

        const newArray = arrayMove(items, oldIndex, newIndex);
        const orderUpdates = newArray.map((cat, index) => ({ id: cat.id, order: index }));
        axios.post(`${API_URL}/api/update-order/categories`, orderUpdates);
        return newArray;
      });
      return;
    }

    // サイトの並び替え
    if (activeId.startsWith('site-')) {
      const activeContainerId = getContainerId(activeId);
      let overContainerId = getContainerId(overId);
      if (overId.startsWith('category-')) {
          overContainerId = overId;
      }

      if (!activeContainerId || !overContainerId) return;

      setCategories(prev => {
        const sourceCatIndex = prev.findIndex(c => `category-${c.id}` === activeContainerId);
        const destCatIndex = prev.findIndex(c => `category-${c.id}` === overContainerId);
        const activeIndex = prev[sourceCatIndex].sites.findIndex(s => `site-${s.id}` === activeId);
        
        let overIndex;
        if (overId.startsWith('site-')) {
            overIndex = prev[destCatIndex].sites.findIndex(s => `site-${s.id}` === overId);
        } else {
            overIndex = prev[destCatIndex].sites.length;
        }

        let newCategories = JSON.parse(JSON.stringify(prev));
        if (activeContainerId === overContainerId) { // カテゴリ内移動
            newCategories[sourceCatIndex].sites = arrayMove(newCategories[sourceCatIndex].sites, activeIndex, overIndex);
            const orderUpdates = newCategories[sourceCatIndex].sites.map((site, index) => ({ id: site.id, order: index }));
            axios.post(`${API_URL}/api/update-order/sites`, orderUpdates);
        } else { // カテゴリ間移動
            const [movedItem] = newCategories[sourceCatIndex].sites.splice(activeIndex, 1);
            newCategories[destCatIndex].sites.splice(overIndex, 0, movedItem);

            const sourceOrderUpdates = newCategories[sourceCatIndex].sites.map((site, index) => ({ id: site.id, order: index }));
            axios.post(`${API_URL}/api/update-order/sites`, sourceOrderUpdates);
            
            const destOrderUpdates = newCategories[destCatIndex].sites.map((site, index) => ({ id: site.id, order: index }));
            axios.post(`${API_URL}/api/update-order/sites`, destOrderUpdates);
            
            const siteId = parseInt(activeId.replace('site-', ''));
            const newCategoryId = parseInt(overContainerId.replace('category-', ''));
            axios.post(`${API_URL}/api/move-site`, { site_id: siteId, new_category_id: newCategoryId });
        }
        return newCategories;
      });
    }
  }
  
  const filteredCategories = useMemo(() => categories.map(category => ({
    ...category,
    sites: category.sites.filter(site => 
      (site.title && site.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (site.url && site.url.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    category.sites.length > 0
  ), [categories, searchTerm]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>サイト管理アプリ</h2>
        <div className="form-section">
          <h3>新しいカテゴリを追加</h3>
          <form onSubmit={handleCreateCategory}>
            <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="カテゴリ名（例: 仕事用、課題）" required />
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="dashboard">
            <SortableContext items={filteredCategories.map(c => `category-${c.id}`)} strategy={rectSortingStrategy}>
              {filteredCategories.map(category => (
                <CategoryCard key={category.id} category={category} onDeleteCategory={handleDeleteCategory} onUpdateCategory={handleUpdateCategory}>
                   <SortableContext items={category.sites.map(s => `site-${s.id}`)} strategy={verticalListSortingStrategy}>
                      <ul className="site-list">
                        {category.sites.map(site => (
                          <SiteItem key={site.id} site={site} onDelete={handleDeleteSite} onUpdateTitle={handleUpdateSiteTitle} />
                        ))}
                      </ul>
                   </SortableContext>
                </CategoryCard>
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </main>
    </div>
  );
}

export default App;
