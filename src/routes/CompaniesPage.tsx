import { useState, FormEvent, useEffect } from 'react';
import { Plus, Search, Building2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';

type Company = Database['public']['Tables']['companies']['Row'];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formLegalName, setFormLegalName] = useState('');
  const [formSector, setFormSector] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmails, setFormEmails] = useState('');
  
  // Tax portal data
  const [taxRegistrationNumber, setTaxRegistrationNumber] = useState('');
  const [taxFileNumber, setTaxFileNumber] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [taxUsername, setTaxUsername] = useState('');
  const [taxPassword, setTaxPassword] = useState('');
  const [otherTaxData, setOtherTaxData] = useState('');
  
  const [formRequiredFields, setFormRequiredFields] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching companies:', error);
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.legal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const taxPortalData = {
      tax_registration_number: taxRegistrationNumber,
      tax_file_number: taxFileNumber,
      tax_office: taxOffice,
      registered_email: registeredEmail,
      registered_phone: registeredPhone,
      username: taxUsername,
      password: taxPassword,
      other_data: otherTaxData,
    };
    
    if (editingCompany) {
      // Update existing company
      const { error } = await supabase
        .from('companies')
        .update({
          name: formName,
          legal_name: formLegalName,
          sector: formSector,
          address: formAddress || null,
          phone: formPhone || null,
          contact_person: formContactPerson || null,
          mobile: formMobile || null,
          emails: formEmails || null,
          tax_portal_data: taxPortalData,
          required_fields: formRequiredFields || null,
          notes: formNotes || null,
        })
        .eq('id', editingCompany.id);
      
      if (error) {
        console.error('Error updating company:', error);
        alert('حدث خطأ أثناء تحديث الشركة');
        return;
      }
      
      setEditingCompany(null);
    } else {
      // Create new company
      const { error } = await supabase
        .from('companies')
        .insert({
          name: formName,
          legal_name: formLegalName,
          sector: formSector,
          address: formAddress || null,
          phone: formPhone || null,
          contact_person: formContactPerson || null,
          mobile: formMobile || null,
          emails: formEmails || null,
          tax_portal_data: taxPortalData,
          required_fields: formRequiredFields || null,
          notes: formNotes || null,
        });
      
      if (error) {
        console.error('Error creating company:', error);
        alert('حدث خطأ أثناء إضافة الشركة');
        return;
      }
    }
    
    // Reset form and refresh
    resetForm();
    setIsCreating(false);
    await fetchCompanies();
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormName(company.name);
    setFormLegalName(company.legal_name);
    setFormSector(company.sector);
    setFormAddress(company.address || '');
    setFormPhone(company.phone || '');
    setFormContactPerson(company.contact_person || '');
    setFormMobile(company.mobile || '');
    setFormEmails(company.emails || '');
    
    // Load tax portal data
    const taxData = company.tax_portal_data as any;
    if (taxData) {
      setTaxRegistrationNumber(taxData.tax_registration_number || '');
      setTaxFileNumber(taxData.tax_file_number || '');
      setTaxOffice(taxData.tax_office || '');
      setRegisteredEmail(taxData.registered_email || '');
      setRegisteredPhone(taxData.registered_phone || '');
      setTaxUsername(taxData.username || '');
      setTaxPassword(taxData.password || '');
      setOtherTaxData(taxData.other_data || '');
    }
    
    setFormRequiredFields(company.required_fields || '');
    setFormNotes(company.notes || '');
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟')) return;
    
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting company:', error);
      alert('حدث خطأ أثناء حذف الشركة');
      return;
    }
    
    await fetchCompanies();
  };

  const resetForm = () => {
    setFormName('');
    setFormLegalName('');
    setFormSector('');
    setFormAddress('');
    setFormPhone('');
    setFormContactPerson('');
    setFormMobile('');
    setFormEmails('');
    setTaxRegistrationNumber('');
    setTaxFileNumber('');
    setTaxOffice('');
    setRegisteredEmail('');
    setRegisteredPhone('');
    setTaxUsername('');
    setTaxPassword('');
    setOtherTaxData('');
    setFormRequiredFields('');
    setFormNotes('');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingCompany(null);
    resetForm();
  };

  if (loading) {
    return <div className="text-center text-gray-600" dir="rtl">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إدارة الشركات</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-2 btn-primary"
        >
          <Plus className="h-4 w-4" /> إضافة شركة
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {editingCompany ? 'تعديل الشركة' : 'شركة جديدة'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b">
                البيانات الأساسية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم الشركة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: DEBI"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الكيان القانوني <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formLegalName}
                    onChange={(e) => setFormLegalName(e.target.value)}
                    placeholder="مثال: ديبي"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    القطاع <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    placeholder="مثال: تكنولوجيا، تجارة، صناعة..."
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عنوان الشركة
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="مثال: القاهرة، مصر الجديدة..."
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b">
                بيانات التواصل
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم تليفون
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="مثال: 0223456789"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    شخص التواصل
                  </label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="مثال: أحمد محمد"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم موبايل
                  </label>
                  <input
                    type="tel"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    placeholder="مثال: 01012345678"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني (يمكن إضافة أكثر من بريد)
                  </label>
                  <input
                    type="text"
                    value={formEmails}
                    onChange={(e) => setFormEmails(e.target.value)}
                    placeholder="مثال: info@company.com, sales@company.com"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>
              </div>
            </div>

            {/* Tax Portal Data */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b">
                بيانات بوابة الضرائب
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم التسجيل الضريبي
                  </label>
                  <input
                    type="text"
                    value={taxRegistrationNumber}
                    onChange={(e) => setTaxRegistrationNumber(e.target.value)}
                    placeholder="مثال: 123-456-789"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الملف الضريبي
                  </label>
                  <input
                    type="text"
                    value={taxFileNumber}
                    onChange={(e) => setTaxFileNumber(e.target.value)}
                    placeholder="مثال: 987-654-321"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المأمورية التابعة
                  </label>
                  <input
                    type="text"
                    value={taxOffice}
                    onChange={(e) => setTaxOffice(e.target.value)}
                    placeholder="مثال: مأمورية القاهرة"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني المسجل
                  </label>
                  <input
                    type="email"
                    value={registeredEmail}
                    onChange={(e) => setRegisteredEmail(e.target.value)}
                    placeholder="مثال: tax@company.com"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم التليفون المسجل
                  </label>
                  <input
                    type="tel"
                    value={registeredPhone}
                    onChange={(e) => setRegisteredPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم المستخدم
                  </label>
                  <input
                    type="text"
                    value={taxUsername}
                    onChange={(e) => setTaxUsername(e.target.value)}
                    placeholder="اسم المستخدم في بوابة الضرائب"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الرقم السري
                  </label>
                  <input
                    type="password"
                    value={taxPassword}
                    onChange={(e) => setTaxPassword(e.target.value)}
                    placeholder="كلمة المرور"
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    بيانات أخرى
                  </label>
                  <textarea
                    value={otherTaxData}
                    onChange={(e) => setOtherTaxData(e.target.value)}
                    placeholder="أي بيانات إضافية متعلقة بالضرائب..."
                    rows={2}
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b">
                معلومات إضافية
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المطلوبات
                  </label>
                  <input
                    type="text"
                    value={formRequiredFields}
                    onChange={(e) => setFormRequiredFields(e.target.value)}
                    placeholder="مثال: رخصة تجارية، سجل ضريبي..."
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ملاحظات (اختياري)
                  </label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية..."
                    rows={3}
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                إلغاء
              </button>
              <button type="submit" className="btn-primary">
                {editingCompany ? 'حفظ التعديلات' : 'إضافة الشركة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن شركة..."
            className="w-full rounded-md border-0 py-2 pr-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
          />
        </div>
      </div>

      {/* Companies Table */}
      <div className="card overflow-hidden">
        {filteredCompanies.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              لا توجد شركات
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              ابدأ بإضافة الشركات لإدارة المهام الخاصة بها
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم الشركة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الاسم القانوني
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      القطاع
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التواصل
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{company.name}</div>
                        {company.address && (
                          <div className="text-xs text-gray-500 mt-1">{company.address}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{company.legal_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{company.sector}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-1">
                          {company.contact_person && (
                            <div className="text-xs">👤 {company.contact_person}</div>
                          )}
                          {company.mobile && (
                            <div className="text-xs">📱 {company.mobile}</div>
                          )}
                          {company.phone && (
                            <div className="text-xs">☎️ {company.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(company)}
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-red-600 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <div key={company.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {company.legal_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mr-2">
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-red-600 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">القطاع:</span>
                      <span className="text-sm text-gray-900">{company.sector}</span>
                    </div>
                    {company.address && (
                      <div className="flex items-start">
                        <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">العنوان:</span>
                        <span className="text-sm text-gray-900">{company.address}</span>
                      </div>
                    )}
                    {company.contact_person && (
                      <div className="flex items-start">
                        <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">التواصل:</span>
                        <span className="text-sm text-gray-900">{company.contact_person}</span>
                      </div>
                    )}
                    {company.mobile && (
                      <div className="flex items-start">
                        <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">موبايل:</span>
                        <span className="text-sm text-gray-900">{company.mobile}</span>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-start">
                        <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">تليفون:</span>
                        <span className="text-sm text-gray-900">{company.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
