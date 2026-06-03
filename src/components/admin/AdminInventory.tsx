import { useState, useEffect } from 'react';
import { auth } from '../../firebase';

interface CatalogItem {
  id: string;
  variationId: string | null;
  name: string;
  description: string;
  price: number;
  priceCents: number;
  imageUrl: string | null;
  categoryId: string | null;
  hidden?: boolean;
}

interface Category {
  id: string;
  name: string;
}

async function getToken() {
  return auth.currentUser?.getIdToken() ?? null;
}

export default function AdminInventory() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/catalog?admin=true')
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setCategories(data.categories || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleVisibility = async (itemId: string, currentlyHidden: boolean) => {
    setTogglingId(itemId);
    try {
      const token = await getToken();
      const resp = await fetch('/api/catalog-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId, hidden: !currentlyHidden }),
      });
      if (resp.ok) {
        setItems((prev) => prev.map((it) => it.id === itemId ? { ...it, hidden: !currentlyHidden } : it));
        localStorage.removeItem('shake_catalog');
      }
    } catch { /* ignore */ }
    finally { setTogglingId(null); }
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDesc(item.description);
    setEditPrice((item.priceCents / 100).toFixed(2));
    setSaveError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSaveError('');
  };

  const handleSave = async (itemId: string) => {
    setSaving(true);
    setSaveError('');
    try {
      const token = await getToken();
      const resp = await fetch('/api/catalog-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId,
          name: editName,
          description: editDesc,
          priceCents: Math.round(parseFloat(editPrice) * 100),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setSaveError(data.error || 'Save failed');
        return;
      }
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                name: editName,
                description: editDesc,
                priceCents: Math.round(parseFloat(editPrice) * 100),
                price: parseFloat(editPrice),
              }
            : it
        )
      );
      setEditingId(null);
      // Clear catalog cache so menu reflects changes immediately
      localStorage.removeItem('shake_catalog');
    } catch {
      setSaveError('Connection error');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return '--';
    const cat = categories.find((c) => c.id === catId);
    return cat?.name || '--';
  };

  const [catFilter, setCatFilter] = useState<string>('all');

  const filtered = items.filter((it) => {
    const matchesSearch = !search ||
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === 'all' || catFilter === 'uncategorized'
      ? catFilter === 'all' || !it.categoryId
      : it.categoryId === catFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="adm-inventory">
      <div className="adm-page-header">
        <h1>Inventory</h1>
        <span className="adm-order-count">{items.length} items</span>
      </div>

      <div className="adm-inv-toolbar">
        <input
          className="adm-search"
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="adm-cat-filter"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="all">All Categories ({items.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({items.filter((i) => i.categoryId === c.id).length})
            </option>
          ))}
          <option value="uncategorized">Uncategorized ({items.filter((i) => !i.categoryId).length})</option>
        </select>
        <div className="adm-view-toggle">
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            &#9776;
          </button>
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            &#9638;
          </button>
        </div>
      </div>

      {loading ? (
        <p className="adm-muted" style={{ padding: '40px 0', textAlign: 'center' }}>Loading catalog...</p>
      ) : viewMode === 'list' ? (
        <div className="adm-inv-list">
          {filtered.map((item) => {
            const isEditing = editingId === item.id;
            const noImage = !item.imageUrl;
            return (
              <div key={item.id} className={`adm-inv-row ${noImage ? 'no-image' : ''} ${item.hidden ? 'is-hidden-item' : ''}`}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="adm-inv-thumb" />
                ) : (
                  <div className="adm-inv-thumb adm-inv-no-img">?</div>
                )}
                <div className="adm-inv-info">
                  {isEditing ? (
                    <>
                      <input
                        className="adm-inv-edit-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                      />
                      <input
                        className="adm-inv-edit-input adm-inv-edit-desc"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description"
                      />
                    </>
                  ) : (
                    <>
                      <span className="adm-inv-name">{item.name}</span>
                      <span className="adm-inv-desc">{item.description}</span>
                    </>
                  )}
                </div>
                <span className="adm-inv-cat">{getCategoryName(item.categoryId)}</span>
                {isEditing ? (
                  <input
                    className="adm-inv-edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                ) : (
                  <span className="adm-inv-price">${(item.priceCents / 100).toFixed(2)}</span>
                )}
                {isEditing ? (
                  <div className="adm-inv-edit-actions">
                    {saveError && <span className="adm-inv-error">{saveError}</span>}
                    <button className="adm-btn-save" onClick={() => handleSave(item.id)} disabled={saving}>
                      {saving ? '...' : 'Save'}
                    </button>
                    <button className="adm-btn-cancel" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      className={`adm-btn-vis ${item.hidden ? 'is-hidden' : ''}`}
                      onClick={() => toggleVisibility(item.id, !!item.hidden)}
                      disabled={togglingId === item.id}
                      title={item.hidden ? 'Show on menu' : 'Hide from menu'}
                    >
                      {togglingId === item.id ? '...' : item.hidden ? '👁️‍🗨️ Show' : '🚫 Hide'}
                    </button>
                    <button className="adm-btn-edit" onClick={() => startEdit(item)}>Edit</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="adm-inv-grid">
          {filtered.map((item) => {
            const noImage = !item.imageUrl;
            return (
              <div key={item.id} className={`adm-inv-card ${noImage ? 'no-image' : ''}`}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="adm-inv-card-img" />
                ) : (
                  <div className="adm-inv-card-img adm-inv-no-img">No Image</div>
                )}
                <div className="adm-inv-card-body">
                  <span className="adm-inv-name">{item.name}</span>
                  <span className="adm-inv-desc">{item.description}</span>
                  <span className="adm-inv-price">${(item.priceCents / 100).toFixed(2)}</span>
                  <button className="adm-btn-edit" onClick={() => startEdit(item)} style={{ marginTop: 8 }}>
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal for grid view */}
      {editingId && viewMode === 'grid' && (
        <div className="catalog-edit-modal" onClick={(e) => { if (e.target === e.currentTarget) cancelEdit(); }}>
          <div className="catalog-edit-form">
            <label>Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} />
            <label>Description</label>
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            <label>Price ($)</label>
            <input type="number" step="0.01" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            {saveError && <p className="auth-error">{saveError}</p>}
            <div className="catalog-edit-actions">
              <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleSave(editingId)} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
