import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Users, FolderTree, Building, Trash2, ArrowUpCircle } from 'lucide-react';

export default function Organization() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'members'>('departments');
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  // New Department Form State
  const [deptName, setDeptName] = useState('');
  const [deptHeadId, setDeptHeadId] = useState('');
  const [parentDeptId, setParentDeptId] = useState('');
  
  // New Category Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [customFields, setCustomFields] = useState<{ name: string; type: string }[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  // Promotion Form State
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [promoRole, setPromoRole] = useState('Employee');
  const [promoDeptId, setPromoDeptId] = useState('');

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, catRes, userRes] = await Promise.all([
        api.get('/org/departments'),
        api.get('/org/categories'),
        api.get('/users')
      ]);
      setDepartments(deptRes.data);
      setCategories(catRes.data);
      setMembers(userRes.data);
    } catch (err) {
      console.error('Failed to load organization settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post('/org/departments', {
        name: deptName,
        head: deptHeadId || undefined,
        parentDepartment: parentDeptId || undefined
      });
      setShowDeptModal(false);
      setDeptName('');
      setDeptHeadId('');
      setParentDeptId('');
      fetchData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to create department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post('/org/categories', {
        name: catName,
        description: catDesc,
        customFields
      });
      setShowCatModal(false);
      setCatName('');
      setCatDesc('');
      setCustomFields([]);
      fetchData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromoteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.put(`/users/${selectedMember._id}`, {
        role: promoRole,
        department: promoDeptId || undefined
      });
      setShowPromoModal(false);
      setSelectedMember(null);
      fetchData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to update member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCustomField = () => {
    if (!newFieldName.trim()) return;
    setCustomFields([...customFields, { name: newFieldName.trim(), type: newFieldType }]);
    setNewFieldName('');
    setNewFieldType('text');
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6 fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Organization Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure company divisions, classification categories, and manage employee directories.</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'departments' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building className="h-4.5 w-4.5" />
          Departments
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'categories' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderTree className="h-4.5 w-4.5" />
          Categories
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'members' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          Members
        </button>
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading information...</div>
          ) : (
            <>
              {/* DEPARTMENTS TAB */}
              {activeTab === 'departments' && (
                <div>
                  <div className="p-4 flex justify-between items-center border-b border-border">
                    <span className="text-sm font-semibold text-foreground">Divisions & Departments</span>
                    {isAdmin && (
                      <Button size="sm" onClick={() => setShowDeptModal(true)} className="gap-1.5">
                        <Plus className="h-4 w-4" /> Add Dept
                      </Button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground bg-accent/20 uppercase">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Department Name</th>
                          <th className="px-6 py-4 font-semibold">Parent Department</th>
                          <th className="px-6 py-4 font-semibold">Department Head</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {departments.map(d => (
                          <tr key={d._id} className="hover:bg-accent/10 transition-colors">
                            <td className="px-6 py-4 font-semibold text-foreground">{d.name}</td>
                            <td className="px-6 py-4 text-muted-foreground">{d.parentDepartment?.name || '-'}</td>
                            <td className="px-6 py-4 text-muted-foreground">{d.head?.name || '-'}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-950/20 text-emerald-400 border border-emerald-900/30">
                                {d.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CATEGORIES TAB */}
              {activeTab === 'categories' && (
                <div>
                  <div className="p-4 flex justify-between items-center border-b border-border">
                    <span className="text-sm font-semibold text-foreground">Asset Classifications</span>
                    {isAdmin && (
                      <Button size="sm" onClick={() => setShowCatModal(true)} className="gap-1.5">
                        <Plus className="h-4 w-4" /> Add Category
                      </Button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground bg-accent/20 uppercase">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Category Name</th>
                          <th className="px-6 py-4 font-semibold">Description</th>
                          <th className="px-6 py-4 font-semibold">Custom Attributes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {categories.map(c => (
                          <tr key={c._id} className="hover:bg-accent/10 transition-colors">
                            <td className="px-6 py-4 font-semibold text-foreground">{c.name}</td>
                            <td className="px-6 py-4 text-muted-foreground">{c.description}</td>
                            <td className="px-6 py-4 text-xs text-primary">
                              {c.customFields?.map((f: any) => `${f.name} (${f.type})`).join(', ') || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MEMBERS TAB */}
              {activeTab === 'members' && (
                <div>
                  <div className="p-4 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">Members & Roles</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground bg-accent/20 uppercase">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Name</th>
                          <th className="px-6 py-4 font-semibold">Email</th>
                          <th className="px-6 py-4 font-semibold">Role</th>
                          <th className="px-6 py-4 font-semibold">Department</th>
                          {isAdmin && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {members.map(m => (
                          <tr key={m._id} className="hover:bg-accent/10 transition-colors">
                            <td className="px-6 py-4 font-semibold text-foreground">{m.name}</td>
                            <td className="px-6 py-4 text-muted-foreground">{m.email}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                                m.role === 'Admin' ? 'bg-red-950/20 text-red-400 border-red-900/30' :
                                m.role === 'Asset Manager' ? 'bg-primary/20 text-primary border-primary/30' :
                                'bg-stone-900/60 text-stone-400 border-stone-850'
                              }`}>
                                {m.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{m.department?.name || '-'}</td>
                            {isAdmin && (
                              <td className="px-6 py-4 text-right">
                                {m._id !== user?._id && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      setSelectedMember(m);
                                      setPromoRole(m.role);
                                      setPromoDeptId(m.department?._id || '');
                                      setShowPromoModal(true);
                                    }}
                                    className="gap-1 text-xs"
                                  >
                                    <ArrowUpCircle className="h-3.5 w-3.5" /> Adjust Role
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* NEW DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 font-sans">
            <h3 className="text-lg font-bold text-foreground">Create Department</h3>
            
            {submitError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateDept} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Department Name</label>
                <Input 
                  required 
                  placeholder="E.g., Marketing / Design" 
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Parent Department (Optional)</label>
                <select 
                  value={parentDeptId}
                  onChange={(e) => setParentDeptId(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                >
                  <option value="">-- None (Top Level) --</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Department Head / Manager</label>
                <select 
                  value={deptHeadId}
                  onChange={(e) => setDeptHeadId(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                >
                  <option value="">-- Choose Head --</option>
                  {members.map(m => (
                    <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowDeptModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Department'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 font-sans max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground">Create Asset Category</h3>
            
            {submitError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateCat} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Category Name</label>
                <Input 
                  required 
                  placeholder="E.g., Vehicles / Lab Equipment" 
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <Input 
                  required 
                  placeholder="E.g., Vehicles and transport vans..." 
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                />
              </div>

              {/* Custom Attributes Setup Builder */}
              <div className="space-y-2 border-t border-border pt-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Custom Category Attributes</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Field Name (E.g. Mileage)" 
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                  />
                  <select 
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="h-10 px-2 py-1.5 text-xs bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Checkbox</option>
                  </select>
                  <Button type="button" onClick={addCustomField} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                
                {customFields.length > 0 && (
                  <div className="space-y-1.5 mt-2 bg-accent/10 p-2 rounded-lg border border-border">
                    {customFields.map((field, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-card p-1.5 rounded border border-border">
                        <span className="text-xs font-semibold text-foreground">{field.name} <span className="text-muted-foreground">({field.type})</span></span>
                        <button type="button" onClick={() => removeCustomField(idx)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowCatModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMOTION / ADJUST ROLE MODAL */}
      {showPromoModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 font-sans">
            <h3 className="text-lg font-bold text-foreground">Adjust User Role & Promotion</h3>
            <p className="text-sm text-muted-foreground">
              Promote or change configuration for <span className="font-semibold text-foreground">{selectedMember.name}</span>
            </p>

            {submitError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handlePromoteMember} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Assign Role</label>
                <select 
                  value={promoRole}
                  onChange={(e) => setPromoRole(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                >
                  <option value="Employee">Employee</option>
                  <option value="Asset Manager">Asset Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Department Assignment</label>
                <select 
                  value={promoDeptId}
                  onChange={(e) => setPromoDeptId(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowPromoModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Promotion'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
