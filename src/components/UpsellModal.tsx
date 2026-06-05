import { useState, useMemo } from 'react';
import type { MenuItem, ModifierList } from '../data/menu';
import type { CartItem, CartItemModifier, CartItemAddOn } from '../hooks/useCart';

interface UpsellModalProps {
  item: MenuItem;
  modifierLists: ModifierList[];
  addOns: MenuItem[];
  onConfirm: (item: Omit<CartItem, 'quantity'>) => void;
  onClose: () => void;
}

export default function UpsellModal({ item, modifierLists, addOns, onConfirm, onClose }: UpsellModalProps) {
  // Get modifier lists that apply to this item
  const applicableLists = useMemo(
    () => modifierLists.filter(ml => (item.modifierListIds || []).includes(ml.id)),
    [modifierLists, item.modifierListIds]
  );

  // State: selected modifier per list (radio — null means "None")
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    applicableLists.forEach(ml => { init[ml.id] = null; });
    return init;
  });

  // State: selected add-on IDs (checkboxes)
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [showAllAddOns, setShowAllAddOns] = useState(false);

  // Priority add-ons shown by default
  const PRIORITY_ADDONS = ['almond milk', 'oat milk', 'protein milk', 'pvl creatine scoop', 'collagene scoop'];
  const priorityAddOns = addOns.filter(a => PRIORITY_ADDONS.some(p => a.name.toLowerCase().includes(p)));
  const extraAddOns = addOns.filter(a => !PRIORITY_ADDONS.some(p => a.name.toLowerCase().includes(p)));
  const visibleAddOns = showAllAddOns ? addOns : priorityAddOns;

  const toggleAddOn = (id: string) => {
    setSelectedAddOns(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Calculate total
  const baseCents = item.priceCents || Math.round(item.price * 100);

  const modifiersCents = useMemo(() => {
    let total = 0;
    for (const ml of applicableLists) {
      const selId = selectedModifiers[ml.id];
      if (selId) {
        const mod = ml.modifiers.find(m => m.id === selId);
        if (mod) total += mod.priceCents;
      }
    }
    return total;
  }, [selectedModifiers, applicableLists]);

  const addOnsCents = useMemo(() => {
    let total = 0;
    for (const addon of addOns) {
      if (selectedAddOns.has(addon.id)) {
        total += addon.priceCents || Math.round(addon.price * 100);
      }
    }
    return total;
  }, [selectedAddOns, addOns]);

  const totalCents = baseCents + modifiersCents + addOnsCents;

  const handleConfirm = () => {
    // Build modifier array
    const mods: CartItemModifier[] = [];
    for (const ml of applicableLists) {
      const selId = selectedModifiers[ml.id];
      if (selId) {
        const mod = ml.modifiers.find(m => m.id === selId);
        if (mod) mods.push({ id: mod.id, name: mod.name, priceCents: mod.priceCents });
      }
    }

    // Build add-on array
    const adds: CartItemAddOn[] = [];
    for (const addon of addOns) {
      if (selectedAddOns.has(addon.id)) {
        adds.push({
          id: addon.id,
          variationId: addon.variationId || addon.id,
          name: addon.name,
          priceCents: addon.priceCents || Math.round(addon.price * 100),
        });
      }
    }

    onConfirm({
      id: item.id,
      cartKey: '',  // will be computed by useCart.add
      variationId: item.variationId || item.id,
      name: item.name,
      price: totalCents / 100,
      basePrice: baseCents / 100,
      imageUrl: item.imageUrl,
      modifiers: mods.length > 0 ? mods : undefined,
      addOns: adds.length > 0 ? adds : undefined,
    });
  };

  return (
    <div className="upsell-overlay" onClick={onClose}>
      <div className="upsell-modal" onClick={e => e.stopPropagation()}>
        <button className="upsell-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Header */}
        <div className="upsell-header">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} />
          ) : (
            <div className="upsell-header-placeholder">SHAKE.</div>
          )}
          <div className="upsell-header-info">
            <h3>{item.name}</h3>
            <span className="upsell-header-price">${item.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Modifier Lists (e.g. Milk) */}
        {applicableLists.map(ml => (
          <div key={ml.id} className="upsell-section">
            <div className="upsell-section-title">{ml.name}</div>
            <label className="upsell-option">
              <input
                type="radio"
                name={`mod-${ml.id}`}
                checked={selectedModifiers[ml.id] === null}
                onChange={() => setSelectedModifiers(prev => ({ ...prev, [ml.id]: null }))}
              />
              <span className="upsell-option-name">None</span>
              <span className="upsell-option-price">FREE</span>
            </label>
            {ml.modifiers.map(mod => (
              <label key={mod.id} className="upsell-option">
                <input
                  type="radio"
                  name={`mod-${ml.id}`}
                  checked={selectedModifiers[ml.id] === mod.id}
                  onChange={() => setSelectedModifiers(prev => ({ ...prev, [ml.id]: mod.id }))}
                />
                <span className="upsell-option-name">{mod.name}</span>
                <span className="upsell-option-price">+${(mod.priceCents / 100).toFixed(2)}</span>
              </label>
            ))}
          </div>
        ))}

        {/* Add-ons */}
        {addOns.length > 0 && (
          <div className="upsell-section">
            <div className="upsell-section-title">Add-ons</div>
            {visibleAddOns.map(addon => (
              <label key={addon.id} className="upsell-option">
                <input
                  type="checkbox"
                  checked={selectedAddOns.has(addon.id)}
                  onChange={() => toggleAddOn(addon.id)}
                />
                <span className="upsell-option-name">{addon.name}</span>
                <span className="upsell-option-price">+${addon.price.toFixed(2)}</span>
              </label>
            ))}
            {!showAllAddOns && extraAddOns.length > 0 && (
              <button
                className="upsell-see-more"
                onClick={() => setShowAllAddOns(true)}
              >
                See more (+{extraAddOns.length})
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="upsell-footer">
          <div className="upsell-total">
            <span>Total</span>
            <span>${(totalCents / 100).toFixed(2)}</span>
          </div>
          <button className="btn btn-primary btn-full" onClick={handleConfirm}>
            ADD TO CART
          </button>
        </div>
      </div>
    </div>
  );
}
