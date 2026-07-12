import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Plus, Wrench, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function AssetDirectory() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'history'>('info');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Register Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [condition, setCondition] = useState('Good');
  const [location, setLocation] = useState('HQ');
  const [isSharedBookable, setIsSharedBookable] = useState(false);
  const [customAttributes, setCustomAttributes] = useState<{ [key: string]: string }>({});

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [assetsRes, catRes, allocRes, maintRes] = await Promise.all([
        api.get('/assets'),
        api.get('/org/categories'),
        api.get('/allocations'),
        api.get('/maintenance')
      ]);
      setAssets(assetsRes.data);
      setCategories(catRes.data);
      setAllocations(allocRes.data);
      setMaintenance(maintRes.data);
    } catch (err) {
      console.error('Failed to load assets data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    
    // Auto-generate asset tag
    const tagIndex = String(assets.length + 1).padStart(4, '0');
    const assetTag = `AF-${tagIndex}`;

    try {
      const payload = {
        name,
        category: categoryId,
        assetTag,
        serialNumber: serialNumber || undefined,
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : undefined,
        acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : undefined,
        condition,
        location,
        isSharedBookable,
        customAttributes
      };

      await api.post('/assets', payload);
      setShowRegModal(false);
      // Reset form
      setName('');
      setCategoryId('');
      setSerialNumber('');
      setAcquisitionDate('');
      setAcquisitionCost('');
      setCondition('Good');
      setLocation('HQ');
      setIsSharedBookable(false);
      setCustomAttributes({});
      fetchInitialData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to register asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    setCustomAttributes({});
  };

  const handleCustomFieldChange = (fieldName: string, value: string) => {
    setCustomAttributes(prev => ({ ...prev, [fieldName]: value }));
  };

  const isManager = user?.role === 'Admin' || user?.role === 'Asset Manager';

  // Filtered Assets list
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter ? asset.status === statusFilter : true;
    const matchesCategory = categoryFilter ? asset.category?._id === categoryFilter : true;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get history logs for selected asset
  const assetAllocations = allocations.filter(a => a.asset?._id === selectedAsset?._id);
  const assetMaintenance = maintenance.filter(m => m.asset?._id === selectedAsset?._id);

  // Selected Category custom fields definition
  const selectedCategoryObj = categories.find(c => c._id === categoryId);

  return (
    <div className="space-y-6 fade-in font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Asset Directory Ledger</h2>
          <p className="text-sm text-muted-foreground mt-1">Register, track, filter, and reconciliation log for company resources.</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowRegModal(true)} className="shrink-0 gap-2 text-sm font-semibold">
            <Plus className="h-4.5 w-4.5" /> Register Asset
          </Button>
        )}
      </div>

      {/* FILTER SEARCH BAR */}
      <Card className="border border-border">
        <div className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input 
              placeholder="Search Tag, Name or Serial No..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 py-1.5 text-xs bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
            >
              <option value="">-- All Statuses --</option>
              <option value="Available">Available</option>
              <option value="Allocated">Allocated</option>
              <option value="Reserved">Reserved</option>
              <option value="Under Maintenance">Under Repair</option>
              <option value="Lost">Lost</option>
              <option value="Retired">Retired</option>
              <option value="Disposed">Disposed</option>
            </select>

            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 py-1.5 text-xs bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
            >
              <option value="">-- All Categories --</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading asset directory ledger...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-accent/20 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Asset Tag</th>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Assigned To</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        No registered assets match your search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => (
                      <tr key={asset._id} className="hover:bg-accent/10 transition-colors">
                        <td 
                          onClick={() => {
                            setSelectedAsset(asset);
                            setDetailTab('info');
                            setShowDetailModal(true);
                          }}
                          className="px-6 py-4 font-semibold text-primary hover:underline cursor-pointer"
                        >
                          {asset.assetTag}
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">{asset.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{asset.category?.name || 'General'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{asset.location}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                            asset.status === 'Available' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' :
                            asset.status === 'Allocated' ? 'bg-stone-900/60 text-stone-400 border-stone-850' :
                            asset.status === 'Under Maintenance' ? 'bg-amber-950/20 text-amber-400 border-amber-900/30' :
                            'bg-destructive/10 text-destructive border-destructive/20'
                          }`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {asset.assignedTo ? (
                            <span className="font-semibold text-foreground">{asset.assignedTo.name}</span>
                          ) : asset.department ? (
                            <span className="font-semibold text-foreground">{asset.department.name}</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setDetailTab('info');
                              setShowDetailModal(true);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* REGISTER ASSET MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 font-sans max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground">Register New Asset</h3>
            
            {submitError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Asset Name</label>
                  <Input required placeholder="E.g., iPad Air 5th Gen" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Category</label>
                  <select 
                    required
                    value={categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Serial Number</label>
                  <Input placeholder="E.g., DMP123XYZ" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Location</label>
                  <Input required placeholder="E.g., Floor 3 / HQ" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Acquisition Date</label>
                  <Input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Acquisition Cost (USD)</label>
                  <Input type="number" step="0.01" placeholder="0.00" value={acquisitionCost} onChange={(e) => setAcquisitionCost(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Physical Condition</label>
                  <select 
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Repair">Needs Repair</option>
                  </select>
                </div>
                <div className="space-y-1.5 flex flex-col justify-center">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isSharedBookable} 
                      onChange={(e) => setIsSharedBookable(e.target.checked)} 
                    />
                    Is Shared Bookable Resource
                  </label>
                </div>
              </div>

              {/* DYNAMIC CUSTOM FIELDS RENDER */}
              {selectedCategoryObj && selectedCategoryObj.customFields && selectedCategoryObj.customFields.length > 0 && (
                <div className="space-y-3 border-t border-border pt-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {selectedCategoryObj.name} Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCategoryObj.customFields.map((field: any, index: number) => (
                      <div key={index} className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">{field.name}</label>
                        {field.type === 'boolean' ? (
                          <div className="h-10 flex items-center">
                            <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={customAttributes[field.name] === 'true'}
                                onChange={(e) => handleCustomFieldChange(field.name, e.target.checked ? 'true' : 'false')}
                              />
                              Yes / Enabled
                            </label>
                          </div>
                        ) : (
                          <Input 
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            placeholder={`Enter ${field.name}...`}
                            value={customAttributes[field.name] || ''}
                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowRegModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Complete Register'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSET DETAIL VIEW MODAL */}
      {showDetailModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedAsset.name}</h3>
                <span className="text-xs text-primary font-semibold tracking-wider uppercase">{selectedAsset.assetTag}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                selectedAsset.status === 'Available' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' :
                selectedAsset.status === 'Allocated' ? 'bg-stone-900/60 text-stone-400 border-stone-850' :
                'bg-amber-950/20 text-amber-400 border-amber-900/30'
              }`}>
                {selectedAsset.status}
              </span>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-border gap-2">
              <button 
                onClick={() => setDetailTab('info')}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 cursor-pointer ${
                  detailTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                }`}
              >
                Specifications
              </button>
              <button 
                onClick={() => setDetailTab('history')}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 cursor-pointer ${
                  detailTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                }`}
              >
                History Logs
              </button>
            </div>

            {/* SPECIFICATIONS TAB */}
            {detailTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Category</span>
                    <span className="font-medium text-foreground">{selectedAsset.category?.name || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Serial Number</span>
                    <span className="font-medium text-foreground">{selectedAsset.serialNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Location</span>
                    <span className="font-medium text-foreground">{selectedAsset.location}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Acquisition Date</span>
                    <span className="font-medium text-foreground">
                      {selectedAsset.acquisitionDate ? format(new Date(selectedAsset.acquisitionDate), 'yyyy-MM-dd') : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Acquisition Cost</span>
                    <span className="font-medium text-foreground">
                      {selectedAsset.acquisitionCost ? `$${selectedAsset.acquisitionCost}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Physical Condition</span>
                    <span className="font-medium text-foreground">{selectedAsset.condition}</span>
                  </div>
                </div>

                {/* Custom fields values render */}
                {selectedAsset.customAttributes && Object.keys(selectedAsset.customAttributes).length > 0 && (
                  <div className="border-t border-border pt-3">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Category Specifications</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {Object.keys(selectedAsset.customAttributes).map((key) => (
                        <div key={key}>
                          <span className="text-xs text-muted-foreground block">{key}</span>
                          <span className="font-medium text-foreground">{selectedAsset.customAttributes[key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {detailTab === 'history' && (
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-primary" /> Checkout History
                  </h4>
                  {assetAllocations.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No allocation log history recorded.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {assetAllocations.map(a => (
                        <div key={a._id} className="p-2 border border-border rounded bg-accent/10 text-xs flex justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              Allocated to: {a.assignedToUser?.name || a.assignedToDepartment?.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {a.status} | Condition out: {a.conditionOut}
                            </p>
                          </div>
                          <span className="text-muted-foreground">{a.status === 'Active' ? 'Ongoing' : 'Returned'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5 text-amber-500" /> Maintenance Log
                  </h4>
                  {assetMaintenance.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No maintenance history recorded.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {assetMaintenance.map(m => (
                        <div key={m._id} className="p-2 border border-border rounded bg-accent/10 text-xs flex justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{m.issueDescription}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {m.status} | Cost: {m.cost ? `$${m.cost}` : 'N/A'}
                            </p>
                          </div>
                          <span className="text-muted-foreground">{m.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <Button onClick={() => setShowDetailModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
