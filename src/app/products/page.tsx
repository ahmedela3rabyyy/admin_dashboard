'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Tag, Barcode, Trash2, X, RefreshCw, AlertTriangle, PackageSearch, Calculator, ChevronDown, Printer } from 'lucide-react';
import { ExportCSV } from '@/components/ExportCSV';

interface Product {
  id: number; storeId: string; name: string; category: string | null; barcode: string | null;
  buyPrice: number; sellPrice: number; stockQuantity: number; minStockLevel: number;
  unit: string | null; largeUnit: string | null; piecesPerUnit: number;
  largeSellPrice: number; allowPieceSale: number; allowLargeSale: number;
}

const CATEGORIES = ["أدوات كتابة", "أدوات هندسية", "أوراق", "مستلزمات مكتبية", "أخرى"];
const LARGE_UNITS = ["علبة", "كرتونة", "دستة", "طقم", "قطعة"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // null = add mode

  // ========== Form State (Matching Desktop) ==========
  const [name, setName] = useState('');
  const [category, setCategory] = useState('أدوات كتابة');
  const [barcode, setBarcode] = useState('');
  const [largeUnit, setLargeUnit] = useState('علبة');
  const [piecesPerUnit, setPiecesPerUnit] = useState(1);
  const [qtyUnits, setQtyUnits] = useState(0);
  const [extraPieces, setExtraPieces] = useState(0);
  const [minStockLevel, setMinStockLevel] = useState(5);
  const [buyUnit, setBuyUnit] = useState(0);  // سعر شراء الوحدة الكبرى
  const [sellUnit, setSellUnit] = useState(0); // سعر بيع الوحدة الكبرى
  const [margin, setMargin] = useState(20);
  const [autoPrice, setAutoPrice] = useState(true);
  const [allowPieceSale, setAllowPieceSale] = useState(true);
  const [allowLargeSale, setAllowLargeSale] = useState(true);

  // ========== Computed ===========
  const totalPieces = (qtyUnits * piecesPerUnit) + extraPieces;
  const buyPerPiece = piecesPerUnit > 0 ? buyUnit / piecesPerUnit : 0;
  const sellPerPiece = piecesPerUnit > 0 ? sellUnit / piecesPerUnit : 0;
  const profitPerPiece = sellPerPiece - buyPerPiece;

  useEffect(() => {
    if (autoPrice && buyUnit > 0) {
      setSellUnit(+(buyUnit * (1 + margin / 100)).toFixed(2));
    }
  }, [buyUnit, margin, autoPrice]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.toLowerCase().includes(search.toLowerCase())) ||
    (p.barcode?.includes(search))
  );

  const lowStock = products.filter(p => p.stockQuantity <= p.minStockLevel);

  const resetForm = () => {
    setName(''); setCategory('أدوات كتابة'); setBarcode(''); setLargeUnit('علبة');
    setPiecesPerUnit(1); setQtyUnits(0); setExtraPieces(0); setMinStockLevel(5);
    setBuyUnit(0); setSellUnit(0); setMargin(20); setAutoPrice(true);
    setAllowPieceSale(true); setAllowLargeSale(true);
  };

  const generateBarcode = () => {
    setBarcode(String(Math.floor(10000000 + Math.random() * 90000000)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!allowPieceSale && !allowLargeSale) return alert('يجب تفعيل البيع بالقطعة أو الوحدة الكبرى على الأقل!');

    setSubmitting(true);
    try {
      const body: any = {
        name: name.trim(), category, barcode: barcode || undefined,
        buyPrice: buyPerPiece, sellPrice: sellPerPiece,
        stockQuantity: totalPieces, minStockLevel,
        unit: 'قطعة', largeUnit, piecesPerUnit,
        largeSellPrice: sellUnit,
        allowPieceSale: allowPieceSale ? 1 : 0,
        allowLargeSale: allowLargeSale ? 1 : 0,
      };
      
      let res;
      if (editingId !== null) {
        body.id = editingId;
        res = await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      
      if (res.ok) { setShowModal(false); resetForm(); setEditingId(null); fetchProducts(); }
      else { const d = await res.json(); alert(d.error || 'حدث خطأ'); }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setCategory(p.category || 'أدوات كتابة');
    setBarcode(p.barcode || '');
    setLargeUnit(p.largeUnit || 'علبة');
    setPiecesPerUnit(p.piecesPerUnit || 1);
    const pp = p.piecesPerUnit || 1;
    setQtyUnits(Math.floor(p.stockQuantity / pp));
    setExtraPieces(p.stockQuantity % pp);
    setMinStockLevel(p.minStockLevel);
    setBuyUnit(+(p.buyPrice * pp).toFixed(2));
    setSellUnit(p.largeSellPrice > 0 ? p.largeSellPrice : +(p.sellPrice * pp).toFixed(2));
    setAutoPrice(false);
    setAllowPieceSale(p.allowPieceSale === 1);
    setAllowLargeSale(p.allowLargeSale === 1);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchProducts();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1">إدارة المنتجات</h2>
          <p className="text-slate-400">
            إجمالي: <span className="text-white font-bold">{products.length}</span> منتج
            {lowStock.length > 0 && <span className="text-amber-400 mr-4"><AlertTriangle className="inline h-3.5 w-3.5 ml-1" />{lowStock.length} منتج مخزونه منخفض</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن منتج..."
              className="pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64" />
          </div>
          <button onClick={() => fetchProducts()} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all" title="تحديث"><RefreshCw className="h-4 w-4" /></button>
          <ExportCSV
            data={products.map(p => ({ name: p.name, category: p.category || '', barcode: p.barcode || '', buyPrice: p.buyPrice, sellPrice: p.sellPrice, stock: p.stockQuantity, unit: p.unit || '' }))}
            filename="products_report"
            headers={[
              { key: 'name', label: 'الاسم' }, { key: 'category', label: 'التصنيف' },
              { key: 'barcode', label: 'الباركود' }, { key: 'buyPrice', label: 'سعر الشراء' },
              { key: 'sellPrice', label: 'سعر البيع' }, { key: 'stock', label: 'المخزون' },
            ]}
          />
          <button onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 font-medium">
            <Plus className="h-4 w-4" /><span>إضافة منتج</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filtered.map(product => (
            <div key={product.id} className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/10"></div>
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors leading-tight">{product.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400"><Tag className="h-3 w-3" /><span>{product.category || 'بدون تصنيف'}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-slate-800 text-xs text-slate-300 rounded-full font-mono flex items-center gap-1"><Barcode className="h-3 w-3" />{product.barcode || 'N/A'}</div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(product)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="تعديل">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-2 my-3 p-3 bg-slate-950/50 rounded-xl relative z-10 text-center">
                <div><p className="text-[10px] text-slate-500 mb-0.5">شراء/قطعة</p><p className="font-medium text-slate-300 text-sm">{product.buyPrice.toFixed(2)}</p></div>
                <div><p className="text-[10px] text-slate-500 mb-0.5">بيع/قطعة</p><p className="font-bold text-emerald-400 text-sm">{product.sellPrice.toFixed(2)}</p></div>
                <div><p className="text-[10px] text-slate-500 mb-0.5">ربح/قطعة</p><p className={`font-bold text-sm ${(product.sellPrice - product.buyPrice) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{(product.sellPrice - product.buyPrice).toFixed(2)}</p></div>
              </div>

              {/* Unit info */}
              {product.piecesPerUnit > 1 && (
                <div className="text-[11px] text-slate-500 bg-slate-950/30 rounded-lg px-3 py-1.5 mb-2 flex items-center justify-between">
                  <span>الوحدة: {product.largeUnit} ({product.piecesPerUnit} قطعة)</span>
                  <span>سعر الـ{product.largeUnit}: {product.largeSellPrice?.toFixed(2)} ج.م</span>
                </div>
              )}

              {/* Stock */}
              <div className="flex items-center justify-between mt-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${product.stockQuantity > product.minStockLevel ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                  <span className="text-sm text-slate-300">المخزون: <strong className="text-white">{product.stockQuantity}</strong> {product.unit}</span>
                </div>
                {product.stockQuantity <= product.minStockLevel && <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-medium">منخفض</span>}
              </div>

              {/* Sale permissions */}
              <div className="flex gap-2 mt-2">
                {product.allowPieceSale === 1 && <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">بيع قطعة ✓</span>}
                {product.allowLargeSale === 1 && product.piecesPerUnit > 1 && <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">بيع {product.largeUnit} ✓</span>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="col-span-full text-center py-20 bg-slate-900 rounded-2xl border border-dashed border-slate-800">
              <PackageSearch className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">{search ? 'لا توجد نتائج' : 'لا توجد منتجات'}</h3>
              <p className="text-slate-500">{search ? `لا توجد منتجات تطابق "${search}"` : 'أضف منتجات من هنا أو قم بمزامنة بيانات المكتبة.'}</p>
            </div>
          )}
        </div>
      )}

      {/* ====================== ADD PRODUCT MODAL ====================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Package className="h-5 w-5 text-blue-500" /></div>
                {editingId !== null ? 'تعديل منتج' : 'إضافة منتج جديد'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* ========== بيانات الصنف ========== */}
              <div className="border border-slate-800 rounded-xl p-4 space-y-4">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2"><Tag className="h-4 w-4" />بيانات الصنف</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">اسم المنتج *</label>
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="مثال: قلم رصاص فابر كاستل"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">التصنيف</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">الباركود</label>
                    <div className="flex gap-2">
                      <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="امسح الباركود..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                      <button type="button" onClick={generateBarcode} className="px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all">توليد</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========== المخزون والوحدات ========== */}
              <div className="border border-slate-800 rounded-xl p-4 space-y-4">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2"><Package className="h-4 w-4" />المخزون والوحدات</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">نوع الوحدة الكبرى</label>
                    <select value={largeUnit} onChange={e => setLargeUnit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                      {LARGE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">محتوى الوحدة (كم قطعة)</label>
                    <input type="number" min={1} value={piecesPerUnit} onChange={e => setPiecesPerUnit(Math.max(1, +e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">رصيد (الوحدات الكبرى)</label>
                    <input type="number" min={0} value={qtyUnits} onChange={e => setQtyUnits(+e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">رصيد (القطع الفكة)</label>
                    <input type="number" min={0} value={extraPieces} onChange={e => setExtraPieces(+e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">حد التنبيه الأدنى (قطعة)</label>
                    <input type="number" min={0} value={minStockLevel} onChange={e => setMinStockLevel(+e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* Stock Display */}
                <div className={`text-center py-3 rounded-xl font-bold text-sm ${totalPieces < minStockLevel ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-300'}`}>
                  إجمالي الرصيد الفعلي: {totalPieces} قطعة
                </div>

                {/* Sale Permissions */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={allowPieceSale} onChange={e => setAllowPieceSale(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500" />
                    <span className="text-sm text-slate-300">مسموح ببيعه بالقطعة</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={allowLargeSale} onChange={e => setAllowLargeSale(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500" />
                    <span className="text-sm text-slate-300">مسموح ببيعه بالوحدة الكبرى</span>
                  </label>
                </div>
              </div>

              {/* ========== التسعير والأرباح ========== */}
              <div className="border border-slate-800 rounded-xl p-4 space-y-4">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2"><Calculator className="h-4 w-4" />التسعير والأرباح</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">سعر شراء ({largeUnit})</label>
                    <input type="number" step="0.01" min={0} value={buyUnit || ''} onChange={e => setBuyUnit(+e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">سعر بيع ({largeUnit})</label>
                    <input type="number" step="0.01" min={0} value={sellUnit || ''} onChange={e => { setSellUnit(+e.target.value); setAutoPrice(false); }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-emerald-400 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                  </div>
                </div>

                {/* Auto-pricing */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={autoPrice} onChange={e => setAutoPrice(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500" />
                    <span className="text-sm text-slate-300">تسعير تلقائي بناءً على الهامش</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">نسبة الربح %</label>
                    <input type="number" step="0.5" min={0} value={margin} onChange={e => { setMargin(+e.target.value); setAutoPrice(true); }}
                      className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* Per-Piece Calculation */}
                <div className={`text-center py-3 rounded-xl font-bold text-sm ${profitPerPiece < (buyPerPiece * 0.05) ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  للقطعة الواحدة 👉 شراء: {buyPerPiece.toFixed(2)} | بيع: {sellPerPiece.toFixed(2)} | ربح: {profitPerPiece.toFixed(2)} ج.م
                </div>
              </div>

              {/* ========== Buttons ========== */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all font-medium">إلغاء</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus className="h-4 w-4" />}
                  {submitting ? 'جاري الحفظ...' : editingId !== null ? 'حفظ التعديلات' : 'حفظ المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
