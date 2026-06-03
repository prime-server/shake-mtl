import { useState, useEffect } from 'react';
import { auth } from '../firebase';

interface CatalogItem {
  id: string;
  variationId: string | null;
  name: string;
  description: string;
  price: number;
  priceCents: number;
  imageUrl: string | null;
}

export default function CatalogEditor() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetch('/api/catalog')
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    setEditName(item.name);
    setEditDesc(item.description);
    setEditPrice((item.priceCents / 100).toFixed(2));
    setSaveError('');
  };

  const closeEdit = () => {
    setEditing(null);
    setSaveError('');
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setSaveError('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const resp = await fetch('/api/catalog-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId: editing.id,
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
      // Update local list
      setItems((prev) =>
        prev.map((it) =>
          it.id === editing.id
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
      closeEdit();
    } catch {
      setSaveError('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading catalog...</p>;
  }

  return (
    <>
      <div className="catalog-list">
        {items.map((item) => (
          <div key={item.id} className="catalog-item">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="catalog-item-img" />
            ) : (
              <div className="catalog-item-img" />
            )}
            <div className="catalog-item-info">
              <div className="catalog-item-name">{item.name}</div>
              <div className="catalog-item-desc">{item.description}</div>
            </div>
            <span className="catalog-item-price">${(item.priceCents / 100).toFixed(2)}</span>
            <button className="catalog-edit-btn" onClick={() => openEdit(item)}>Edit</button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="catalog-edit-modal" onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}>
          <div className="catalog-edit-form">
            <label>Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} />
            <label>Description</label>
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            <label>Price ($)</label>
            <input type="number" step="0.01" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            {saveError && <p className="auth-error">{saveError}</p>}
            <div className="catalog-edit-actions">
              <button className="btn btn-ghost" onClick={closeEdit}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
