import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';

export default function Employees() {
  // Unpaginated full list state for Leaderboard
  const [allEmployees, setAllEmployees] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  // Paginated list hook for main table
  const pag = usePagination(api.employees.list, 10, true);

  // Register form states
  const [showRegForm, setShowRegForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Cashier');

  // Selected Employee & Detail summary states
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);

  // Detail view navigation tab state
  const [activeTab, setActiveTab] = useState('Profile'); // Profile, Attendance, Advances, Payroll

  // Profile Edit states
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileRole, setProfileRole] = useState('Cashier');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileUploading, setProfileUploading] = useState(false);

  // Registration Image upload states
  const [regImageUrl, setRegImageUrl] = useState('');
  const [regUploading, setRegUploading] = useState(false);

  // Form inputs inside Detail Panel
  const [basicSalaryInput, setBasicSalaryInput] = useState('');
  const [allowanceInput, setAllowanceInput] = useState('0');
  const [payrollDescription, setPayrollDescription] = useState('');
  const [payrollPaidFrom, setPayrollPaidFrom] = useState('');

  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDescription, setAdvanceDescription] = useState('');
  const [advancePaidFrom, setAdvancePaidFrom] = useState('');

  // Calendar states
  const [selectedMonth, setSelectedMonth] = useState('2026-06'); // Default June 2026

  // Edit payroll states
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [editAllowance, setEditAllowance] = useState('0');
  const [editBasicSalary, setEditBasicSalary] = useState('0');
  const [editPaidFrom, setEditPaidFrom] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Audit trail state
  const [auditTrail, setAuditTrail] = useState([]);
  const [viewingAuditPayrollId, setViewingAuditPayrollId] = useState(null);

  const loadLeaderboard = () => {
    setLeaderboardLoading(true);
    api.employees.list()
      .then((data) => {
        setAllEmployees(data);
        setLeaderboardLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLeaderboardLoading(false);
      });
  };

  const loadBankAccounts = () => {
    api.bankAccounts.list()
      .then((data) => {
        setBankAccounts(data);
        if (data.length > 0) {
          setPayrollPaidFrom(data[0].id);
          setAdvancePaidFrom(data[0].id);
          setEditPaidFrom(data[0].id);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadLeaderboard();
    loadBankAccounts();
  }, []);

  const loadSummary = (empId) => {
    setSummaryLoading(true);
    api.employees.payrollSummary(empId)
      .then((data) => {
        setSummary(data);
        setSummaryLoading(false);
      })
      .catch((err) => {
        alert('Error loading payroll summary: ' + err.message);
        setSummaryLoading(false);
      });
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setBasicSalaryInput(emp.basic_salary);
    setProfileFirstName(emp.user?.first_name || '');
    setProfileLastName(emp.user?.last_name || '');
    setProfileUsername(emp.user?.username || '');
    setProfilePassword('');
    setProfileEmail(emp.user?.email || '');
    setProfilePhone(emp.phone || '');
    setProfileRole(emp.role || 'Cashier');
    setProfileImageUrl(emp.image_url || '');

    setAllowanceInput('0');
    setPayrollDescription('');
    setAdvanceAmount('');
    setAdvanceDescription('');
    setEditingPayroll(null);
    setViewingAuditPayrollId(null);
    setActiveTab('Profile');
    loadSummary(emp.id);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updateData = {
      first_name: profileFirstName,
      last_name: profileLastName,
      username: profileUsername,
      email: profileEmail,
      phone: profilePhone,
      role: profileRole,
      basic_salary: basicSalaryInput,
      image_url: profileImageUrl,
    };
    if (profilePassword) {
      updateData.password = profilePassword;
    }

    api.employees.update(selectedEmployee.id, updateData)
      .then((data) => {
        alert('Profile & Salary settings updated successfully!');
        setSelectedEmployee(data);
        // Refresh editing states
        setProfileFirstName(data.user?.first_name || '');
        setProfileLastName(data.user?.last_name || '');
        setProfileUsername(data.user?.username || '');
        setProfilePassword('');
        setProfileEmail(data.user?.email || '');
        setProfilePhone(data.phone || '');
        setProfileRole(data.role || 'Cashier');
        setProfileImageUrl(data.image_url || '');
        setBasicSalaryInput(data.basic_salary);

        loadSummary(data.id);
        pag.refresh();
        loadLeaderboard();
      })
      .catch((err) => alert(err.message));
  };

  const handleCloudinaryUpload = async (file, onStart, onEnd, onSuccess) => {
    onStart();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'axor_avp4mtcg');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dx5bqewfx/auto/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.secure_url) {
        onSuccess(data.secure_url);
      } else {
        alert('Upload failed: ' + (data.error?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Cloudinary upload error: ' + err.message);
    } finally {
      onEnd();
    }
  };

  const handleRegImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleCloudinaryUpload(
      file,
      () => setRegUploading(true),
      () => setRegUploading(false),
      (url) => setRegImageUrl(url)
    );
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleCloudinaryUpload(
      file,
      () => setProfileUploading(true),
      () => setProfileUploading(false),
      (url) => setProfileImageUrl(url)
    );
  };

  const handleRegister = (e) => {
    e.preventDefault();
    api.auth.register({
      username,
      password,
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      role,
      image_url: regImageUrl
    })
    .then(() => {
      setShowRegForm(false);
      setUsername('');
      setPassword('');
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setRole('Cashier');
      setRegImageUrl('');
      alert('Employee Registered Successfully!');
      pag.refresh();
      loadLeaderboard();
    })
    .catch((err) => alert(err.message));
  };

  const toggleStatus = (emp) => {
    api.employees.update(emp.id, { is_active: !emp.is_active })
      .then(() => {
        pag.refresh();
        loadLeaderboard();
        if (selectedEmployee && selectedEmployee.id === emp.id) {
          setSelectedEmployee({ ...selectedEmployee, is_active: !emp.is_active });
        }
      })
      .catch((err) => alert(err.message));
  };

  const changeRole = (emp, newRole) => {
    api.employees.update(emp.id, { role: newRole })
      .then(() => {
        pag.refresh();
        loadLeaderboard();
        if (selectedEmployee && selectedEmployee.id === emp.id) {
          setSelectedEmployee({ ...selectedEmployee, role: newRole });
        }
      })
      .catch((err) => alert(err.message));
  };

  const handleUpdateSalary = () => {
    api.employees.update(selectedEmployee.id, { basic_salary: basicSalaryInput })
      .then((data) => {
        alert('Basic salary updated successfully!');
        setSelectedEmployee(data);
        loadSummary(selectedEmployee.id);
        pag.refresh();
        loadLeaderboard();
      })
      .catch((err) => alert(err.message));
  };

  const handleRequestAdvance = (e) => {
    e.preventDefault();
    if (!advanceAmount || parseFloat(advanceAmount) <= 0) {
      alert('Please enter a valid advance amount.');
      return;
    }
    api.employeeAdvances.create({
      employee: selectedEmployee.id,
      amount: parseFloat(advanceAmount),
      paid_from: parseInt(advancePaidFrom),
      description: advanceDescription
    })
    .then(() => {
      alert('Advance salary paid out successfully!');
      setAdvanceAmount('');
      setAdvanceDescription('');
      loadSummary(selectedEmployee.id);
      loadBankAccounts();
    })
    .catch((err) => alert(err.message));
  };

  const handleReverseAdvance = (advId) => {
    if (!confirm('Are you sure you want to reverse this advance?')) return;
    api.employeeAdvances.reverse(advId)
      .then(() => {
        alert('Advance salary reversed successfully!');
        loadSummary(selectedEmployee.id);
        loadBankAccounts();
      })
      .catch((err) => alert(err.message));
  };

  const handleProcessPayroll = (e) => {
    e.preventDefault();
    if (!payrollPaidFrom) {
      alert('Please select a bank account to pay from.');
      return;
    }
    api.employeeSalaryPayments.create({
      employee: selectedEmployee.id,
      basic_salary: parseFloat(selectedEmployee.basic_salary),
      allowance: parseFloat(allowanceInput || 0),
      paid_from: parseInt(payrollPaidFrom),
      description: payrollDescription
    })
    .then(() => {
      alert('Payroll processed successfully!');
      setAllowanceInput('0');
      setPayrollDescription('');
      loadSummary(selectedEmployee.id);
      loadBankAccounts();
    })
    .catch((err) => alert(err.message));
  };

  const handleReversePayroll = (payId) => {
    if (!confirm('Are you sure you want to reverse this payroll payment? This will refund bank account and restore advance deductions.')) return;
    api.employeeSalaryPayments.reverse(payId)
      .then(() => {
        alert('Payroll payment reversed successfully!');
        loadSummary(selectedEmployee.id);
        loadBankAccounts();
      })
      .catch((err) => alert(err.message));
  };

  const startEditPayroll = (pay) => {
    setEditingPayroll(pay);
    setEditAllowance(pay.allowance.toString());
    setEditBasicSalary(pay.basic_salary.toString());
    setEditPaidFrom(pay.paid_from || (bankAccounts[0]?.id || ''));
    setEditDescription(pay.description);
  };

  const handleEditPayrollSubmit = (e) => {
    e.preventDefault();
    api.employeeSalaryPayments.edit(editingPayroll.id, {
      basic_salary: parseFloat(editBasicSalary),
      allowance: parseFloat(editAllowance),
      paid_from: parseInt(editPaidFrom),
      description: editDescription
    })
    .then(() => {
      alert('Payroll record updated and recalculated successfully!');
      setEditingPayroll(null);
      loadSummary(selectedEmployee.id);
      loadBankAccounts();
    })
    .catch((err) => alert(err.message));
  };

  const handleViewAuditTrail = (payId) => {
    setViewingAuditPayrollId(payId);
    api.employeeSalaryPayments.auditTrail(payId)
      .then(setAuditTrail)
      .catch((err) => alert('Error fetching audit trail: ' + err.message));
  };

  // Quick toggle/edit attendance from calendar cells
  const handleQuickEditAttendance = (dateStr, currentStatus) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(dateStr);
    if (cellDate > today) {
      alert("Cannot mark attendance for future dates.");
      return;
    }

    const statusMap = {
      'Present': 'Half Day',
      'Half Day': 'Absent',
      'Absent': 'Present'
    };
    const nextStatus = statusMap[currentStatus] || 'Present';
    api.employeeAttendances.bulkMark({
      employee_id: selectedEmployee.id,
      records: [{ date: dateStr, status: nextStatus }]
    })
    .then(() => {
      loadSummary(selectedEmployee.id);
    })
    .catch((err) => alert(err.message));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const renderSortHeader = (label, field) => {
    const isSorted = pag.ordering === field || pag.ordering === `-${field}`;
    const isDesc = pag.ordering === `-${field}`;
    return (
      <th 
        onClick={(e) => {
          e.stopPropagation();
          pag.handleSort(field);
        }}
        className="px-4 py-2 cursor-pointer hover:bg-surface-low select-none transition-colors"
      >
        <div className="flex items-center space-x-1">
          <span>{label}</span>
          <span className="text-text-secondary">
            {isSorted ? (isDesc ? '↓' : '↑') : '↕'}
          </span>
        </div>
      </th>
    );
  };

  // Calendar rendering helper (without bulk mark buttons)
  const renderCalendar = () => {
    if (!summary) return null;
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    const calendarCells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      calendarCells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      calendarCells.push(d);
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-text-secondary">Selected Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded border border-surface-dim bg-white px-2 py-1 text-xs outline-none focus:border-brand-blue"
          />
        </div>

        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-text-secondary text-[11px] uppercase border-b border-surface-low pb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-10 bg-surface/20 rounded"></div>;
            }

            const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
            const att = summary.attendance_records.find(a => a.date === dateStr);
            const status = att ? att.status : 'Unmarked';

            const statusColors = {
              'Present': 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
              'Absent': 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200',
              'Half Day': 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200',
              'Unmarked': 'bg-surface border-surface-dim text-text-secondary hover:bg-surface-low'
            };

            return (
              <button
                key={`day-${day}`}
                onClick={() => handleQuickEditAttendance(dateStr, status)}
                className={`flex flex-col items-center justify-center h-10 border rounded transition select-none ${statusColors[status]}`}
              >
                <span className="text-[11px] font-bold">{day}</span>
                <span className="text-[8px] font-medium tracking-tight uppercase">
                  {status === 'Unmarked' ? '-' : status}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-4 text-[10px] text-text-secondary">
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-green-400"></span>
            <span>Present</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
            <span>Half Day</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-red-400"></span>
            <span>Absent</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-gray-300"></span>
            <span>Unmarked</span>
          </div>
        </div>
      </div>
    );
  };

  const sortedSales = [...allEmployees].sort((a, b) => parseFloat(b.sales_performance) - parseFloat(a.sales_performance));

  if (selectedEmployee) {
    const pendingDeductions = summary ? summary.outstanding_advance_balance : 0;
    const basicSal = parseFloat(selectedEmployee.basic_salary);
    const allowanceVal = parseFloat(allowanceInput || 0);
    const totalDeducted = Math.min(pendingDeductions, basicSal + allowanceVal);
    const calculatedNetPay = Math.max(0, basicSal + allowanceVal - totalDeducted);

    return (
      <div className="space-y-6">
        {/* Back and Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedEmployee(null)}
              className="flex items-center space-x-2 rounded border border-surface-dim bg-white px-3 py-1.5 text-xs text-text-primary hover:bg-surface-low transition"
            >
              <span>←</span>
              <span>Back to Directory</span>
            </button>
            <div className="flex items-center space-x-3">
              {selectedEmployee.image_url ? (
                <img 
                  src={selectedEmployee.image_url} 
                  alt={`${selectedEmployee.user?.first_name} ${selectedEmployee.user?.last_name}`}
                  className="h-12 w-12 rounded-full object-cover border-2 border-brand-blue"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-brand-blue/10 border-2 border-brand-blue flex items-center justify-center font-bold text-brand-blue text-sm uppercase">
                  {(selectedEmployee.user?.first_name?.[0] || '') + (selectedEmployee.user?.last_name?.[0] || '') || selectedEmployee.user?.username?.[0] || '?'}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold tracking-tight text-text-primary">
                  {selectedEmployee.user?.first_name} {selectedEmployee.user?.last_name} ({selectedEmployee.user?.username})
                </h2>
                <p className="text-xs text-text-secondary">Manage profile details, attendance log, advances, and process payroll.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-surface-low border border-surface-dim px-3 py-1 text-xs font-bold text-text-primary">
              {selectedEmployee.role}
            </span>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-surface-low text-sm font-medium">
          {['Profile', 'Attendance', 'Payroll'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition ${
                activeTab === tab 
                  ? 'border-brand-blue text-brand-blue font-semibold' 
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {summaryLoading ? (
          <div className="rounded-lg border border-surface-low bg-white p-12 text-center text-xs text-text-secondary animate-pulse">
            Loading employee payroll records...
          </div>
        ) : (
          summary && (
            <div className="space-y-6">
              {/* Profile & Salary Tab (Combined with Advances) */}
              {activeTab === 'Profile' && (
                <div className="space-y-6">
                  {/* Salary Settings and Financial Totals grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <form onSubmit={handleSaveProfile} className="md:col-span-2 rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-6">
                      <h3 className="text-sm font-semibold text-text-primary border-b border-surface-low pb-2">Profile & Salary Settings</h3>
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex flex-col items-center space-y-2">
                          <span className="block text-xs font-semibold text-text-secondary">Profile Image</span>
                          {profileImageUrl ? (
                            <img 
                              src={profileImageUrl} 
                              alt="Profile Preview"
                              className="h-24 w-24 rounded-full object-cover border-2 border-brand-blue"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="h-24 w-24 rounded-full bg-brand-blue/10 border-2 border-brand-blue/20 flex items-center justify-center font-bold text-brand-blue text-2xl uppercase">
                              {(profileFirstName?.[0] || '') + (profileLastName?.[0] || '') || profileUsername?.[0] || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">First Name</label>
                            <input
                              type="text"
                              value={profileFirstName}
                              onChange={(e) => setProfileFirstName(e.target.value)}
                              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">Last Name</label>
                            <input
                              type="text"
                              value={profileLastName}
                              onChange={(e) => setProfileLastName(e.target.value)}
                              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">Username</label>
                            <input
                              type="text"
                              required
                              value={profileUsername}
                              onChange={(e) => setProfileUsername(e.target.value)}
                              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">Password (Leave blank to keep current)</label>
                            <input
                              type="password"
                              value={profilePassword}
                              onChange={(e) => setProfilePassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">Email</label>
                            <input
                              type="email"
                              value={profileEmail}
                              onChange={(e) => setProfileEmail(e.target.value)}
                              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">Phone Number</label>
                            <input
                              type="text"
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">Role</label>
                            <select
                              value={profileRole}
                              onChange={(e) => setProfileRole(e.target.value)}
                              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                            >
                              <option value="Owner">Owner</option>
                              <option value="Manager">Manager</option>
                              <option value="Cashier">Cashier</option>
                              <option value="Store Keeper">Store Keeper</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">Basic Salary Amount</label>
                            <input
                              type="number"
                              value={basicSalaryInput}
                              onChange={(e) => setBasicSalaryInput(e.target.value)}
                              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-text-secondary mb-1">Profile Image</label>
                            <div className="flex items-center space-x-3 border border-surface-dim rounded bg-surface-low px-3 py-2 w-fit">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfileImageChange}
                                className="text-xs text-text-secondary file:py-1 file:px-3 file:rounded file:border-0 file:bg-brand-blue/10 file:text-brand-blue file:text-xs cursor-pointer"
                              />
                              {profileUploading && <span className="text-[10px] text-text-secondary animate-pulse">Uploading...</span>}
                              {profileImageUrl && !profileUploading && <span className="text-[10px] text-green-600 font-semibold">✓ Uploaded</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-surface-low pt-4 flex justify-end">
                        <button
                          type="submit"
                          className="rounded bg-brand-blue px-4 py-2 text-xs font-bold text-white hover:bg-brand-cobalt transition"
                        >
                          Save Profile & Salary Settings
                        </button>
                      </div>
                    </form>

                    <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4">
                      <h3 className="text-sm font-semibold text-text-primary border-b border-surface-low pb-2">Financial Totals</h3>
                      <div className="space-y-4">
                        <div>
                          <span className="block text-xs font-semibold text-text-secondary">Total Salary Paid</span>
                          <span className="text-xl font-bold text-green-700">{formatCurrency(summary.total_salary_paid)}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-text-secondary">Outstanding Advance Balance</span>
                          <span className="text-xl font-bold text-error">{formatCurrency(summary.outstanding_advance_balance)}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-text-secondary">Pending Deductions</span>
                          <span className="text-xl font-bold text-yellow-700">{formatCurrency(summary.pending_deductions)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salary Advances section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-surface-low pt-6">
                    {/* Advance Request */}
                    <div className="md:col-span-1 rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4">
                      <h3 className="text-sm font-semibold text-text-primary border-b border-surface-low pb-2">Request / Receive Advance</h3>
                      <form onSubmit={handleRequestAdvance} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-text-secondary mb-1">Advance Amount (₹)</label>
                          <input
                            type="number"
                            required
                            value={advanceAmount}
                            onChange={(e) => setAdvanceAmount(e.target.value)}
                            placeholder="E.g., 5000"
                            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-text-secondary mb-1">Paid From Account</label>
                          <select
                            required
                            value={advancePaidFrom}
                            onChange={(e) => setAdvancePaidFrom(e.target.value)}
                            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                          >
                            {bankAccounts.map((acct) => (
                              <option key={acct.id} value={acct.id}>
                                {acct.name} (₹{acct.balance})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-text-secondary mb-1">Advance Description</label>
                          <input
                            type="text"
                            value={advanceDescription}
                            onChange={(e) => setAdvanceDescription(e.target.value)}
                            placeholder="E.g., Mid-month emergency expense"
                            className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full rounded bg-brand-blue py-2 text-xs font-bold text-white hover:bg-brand-cobalt transition"
                        >
                          Issue Advance Salary
                        </button>
                      </form>
                    </div>

                    {/* Advance History */}
                    <div className="md:col-span-2 rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4">
                      <h3 className="text-sm font-semibold text-text-primary border-b border-surface-low pb-2">Salary Advance History</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Amount</th>
                              <th className="px-3 py-2">Paid From</th>
                              <th className="px-3 py-2">Description</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-low">
                            {summary.advance_history.map((adv) => (
                              <tr key={adv.id} className="hover:bg-surface-bright">
                                <td className="px-3 py-2.5 font-semibold text-text-primary">
                                  {new Date(adv.timestamp).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2.5 font-semibold text-text-primary">
                                  {formatCurrency(adv.amount)}
                                </td>
                                <td className="px-3 py-2.5">
                                  {adv.paid_from_name || 'N/A'}
                                </td>
                                <td className="px-3 py-2.5 max-w-xs truncate" title={adv.description}>
                                  {adv.description || '-'}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={`inline-block rounded px-1.5 py-0.5 text-[8px] font-bold ${
                                    adv.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                    adv.status === 'Deducted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {adv.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {adv.status === 'Pending' && (
                                    <button
                                      onClick={() => handleReverseAdvance(adv.id)}
                                      className="rounded bg-error-container/10 hover:bg-error-container/20 px-2 py-0.5 text-[9px] font-bold text-error transition"
                                    >
                                      Reverse
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {summary.advance_history.length === 0 && (
                              <tr>
                                <td colSpan="6" className="px-3 py-8 text-center text-text-secondary">No salary advance logs.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === 'Attendance' && (
                <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4">
                  <h3 className="text-sm font-semibold text-text-primary border-b border-surface-low pb-2">Monthly Attendance Calendar</h3>
                  {renderCalendar()}
                </div>
              )}

              {/* Payroll Tab */}
              {activeTab === 'Payroll' && (
                <div className="space-y-6">
                  {/* Process Monthly Payroll */}
                  <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4">
                    <h3 className="text-sm font-semibold text-text-primary border-b border-surface-low pb-2">Process Monthly Payroll</h3>
                    <form onSubmit={handleProcessPayroll} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Basic Salary</label>
                        <input
                          type="text"
                          disabled
                          value={formatCurrency(selectedEmployee.basic_salary)}
                          className="w-full rounded border border-surface-dim bg-surface px-3 py-2 text-xs text-text-secondary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Allowance Components</label>
                        <input
                          type="number"
                          value={allowanceInput}
                          onChange={(e) => setAllowanceInput(e.target.value)}
                          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Paid From Account</label>
                        <select
                          required
                          value={payrollPaidFrom}
                          onChange={(e) => setPayrollPaidFrom(e.target.value)}
                          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                        >
                          {bankAccounts.map((acct) => (
                            <option key={acct.id} value={acct.id}>
                              {acct.name} (₹{acct.balance})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Payroll Notes / Description</label>
                        <input
                          type="text"
                          value={payrollDescription}
                          onChange={(e) => setPayrollDescription(e.target.value)}
                          placeholder="E.g., June 2026 Salary"
                          className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div className="sm:col-span-3 bg-surface p-4 rounded-lg space-y-2 text-xs text-text-primary">
                        <div className="flex justify-between border-b border-surface-low pb-1">
                          <span>Basic Salary:</span>
                          <span className="font-semibold">{formatCurrency(basicSal)}</span>
                        </div>
                        <div className="flex justify-between border-b border-surface-low pb-1">
                          <span>Allowance Additions:</span>
                          <span className="font-semibold text-green-700">+{formatCurrency(allowanceVal)}</span>
                        </div>
                        <div className="flex justify-between border-b border-surface-low pb-1">
                          <span>Salary Advance Deductions:</span>
                          <span className="font-semibold text-error">-{formatCurrency(totalDeducted)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-brand-blue">
                          <span>Final Net Pay:</span>
                          <span>{formatCurrency(calculatedNetPay)}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <button
                          type="submit"
                          className="rounded bg-brand-blue px-4 py-2 text-xs font-bold text-white hover:bg-brand-cobalt transition"
                        >
                          Approve & Process Payroll
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Edit Payroll Inline Form */}
                  {editingPayroll && (
                    <form onSubmit={handleEditPayrollSubmit} className="rounded-lg bg-yellow-50/50 p-6 shadow-sm border border-yellow-200 space-y-4">
                      <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wider">Edit Processed Payroll</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-text-secondary mb-1">Basic Salary</label>
                          <input
                            type="number"
                            required
                            value={editBasicSalary}
                            onChange={(e) => setEditBasicSalary(e.target.value)}
                            className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-text-secondary mb-1">Allowance</label>
                          <input
                            type="number"
                            required
                            value={editAllowance}
                            onChange={(e) => setEditAllowance(e.target.value)}
                            className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-text-secondary mb-1">Paid From</label>
                          <select
                            required
                            value={editPaidFrom}
                            onChange={(e) => setEditPaidFrom(e.target.value)}
                            className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs outline-none focus:border-brand-blue"
                          >
                            {bankAccounts.map((acct) => (
                              <option key={acct.id} value={acct.id}>
                                {acct.name} (₹{acct.balance})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-text-secondary mb-1">Description</label>
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full rounded border border-surface-dim bg-white px-3 py-1.5 text-xs outline-none focus:border-brand-blue"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="rounded bg-yellow-600 px-4 py-2 text-xs font-bold text-white hover:bg-yellow-700 transition"
                        >
                          Recalculate & Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPayroll(null)}
                          className="rounded bg-surface-low border border-surface-dim px-4 py-2 text-xs text-text-primary hover:bg-surface-dim transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Audit Trail Log viewer */}
                  {viewingAuditPayrollId && (
                    <div className="rounded-lg bg-surface p-6 shadow-inner border border-surface-low space-y-4">
                      <div className="flex items-center justify-between border-b border-surface-dim pb-2">
                        <h4 className="text-xs font-bold text-text-primary">Payroll Audit Trail Log (Payment #{viewingAuditPayrollId})</h4>
                        <button
                          onClick={() => setViewingAuditPayrollId(null)}
                          className="text-[10px] text-text-secondary hover:text-text-primary"
                        >
                          Close Logs
                        </button>
                      </div>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {auditTrail.map((audit) => (
                          <div key={audit.id} className="text-xs border-l-2 border-brand-blue pl-3 py-1 space-y-1">
                            <div className="flex justify-between font-semibold">
                              <span className="text-brand-blue">{audit.action}</span>
                              <span className="text-text-secondary">{new Date(audit.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-text-primary">{audit.description}</p>
                            {audit.old_data && (
                              <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2 rounded border border-surface-low">
                                <div>
                                  <span className="font-semibold block text-text-secondary">Old Data:</span>
                                  <div>Net Paid: {formatCurrency(audit.old_data.total_paid)}</div>
                                  <div>Allowance: {formatCurrency(audit.old_data.allowance)}</div>
                                  <div>Deductions: {formatCurrency(audit.old_data.advance)}</div>
                                </div>
                                <div>
                                  <span className="font-semibold block text-text-secondary">New Data:</span>
                                  <div>Net Paid: {formatCurrency(audit.new_data?.total_paid)}</div>
                                  <div>Allowance: {formatCurrency(audit.new_data?.allowance)}</div>
                                  <div>Deductions: {formatCurrency(audit.new_data?.advance)}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payroll History Table */}
                  <div className="rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4">
                    <h3 className="text-sm font-semibold text-text-primary border-b border-surface-low pb-2">Salary Payments History</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                          <tr>
                            <th className="px-3 py-2">Paid Date</th>
                            <th className="px-3 py-2">Basic</th>
                            <th className="px-3 py-2">Allowance</th>
                            <th className="px-3 py-2">Deductions</th>
                            <th className="px-3 py-2">Net Paid</th>
                            <th className="px-3 py-2">Paid From</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-low">
                          {summary.payroll_history.map((pay) => (
                            <tr key={pay.id} className="hover:bg-surface-bright">
                              <td className="px-3 py-2.5 font-semibold text-text-primary">
                                {new Date(pay.timestamp).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2.5">{formatCurrency(pay.basic_salary)}</td>
                              <td className="px-3 py-2.5">{formatCurrency(pay.allowance)}</td>
                              <td className="px-3 py-2.5 text-error">-{formatCurrency(pay.advance)}</td>
                              <td className="px-3 py-2.5 font-bold text-green-700">{formatCurrency(pay.total_paid)}</td>
                              <td className="px-3 py-2.5">{pay.paid_from_name || 'N/A'}</td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-semibold ${
                                  pay.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {pay.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center space-x-1 whitespace-nowrap">
                                {pay.status === 'Paid' && (
                                  <>
                                    <button
                                      onClick={() => startEditPayroll(pay)}
                                      className="rounded bg-brand-blue/10 hover:bg-brand-blue/20 px-2 py-0.5 text-[10px] font-semibold text-brand-blue transition"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleReversePayroll(pay.id)}
                                      className="rounded bg-error-container/10 hover:bg-error-container/20 px-2 py-0.5 text-[10px] font-semibold text-error transition"
                                    >
                                      Reverse
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleViewAuditTrail(pay.id)}
                                  className="rounded bg-surface-low hover:bg-surface-dim px-2 py-0.5 text-[10px] font-semibold text-text-primary transition"
                                >
                                  Audit
                                </button>
                              </td>
                            </tr>
                          ))}
                          {summary.payroll_history.length === 0 && (
                            <tr>
                              <td colSpan="8" className="px-3 py-8 text-center text-text-secondary">No salary payment records found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Employees & Roles</h2>
          <p className="text-xs text-text-secondary">Manage staff accounts, assign roles, and review sales leaderboards.</p>
        </div>
        <button
          onClick={() => setShowRegForm(!showRegForm)}
          className="rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition"
        >
          {showRegForm ? 'Cancel' : 'Register Employee'}
        </button>
      </div>

      {showRegForm && (
        <form onSubmit={handleRegister} className="rounded-lg bg-white p-6 shadow-sm border border-surface-low space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Add Staff Member</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
              >
                <option value="Owner">Owner</option>
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
                <option value="Store Keeper">Store Keeper</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Profile Image</label>
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleRegImageChange}
                  className="text-xs text-text-secondary file:py-1 file:px-2 file:rounded file:border-0 file:bg-brand-blue/10 file:text-brand-blue file:text-xs cursor-pointer"
                />
                {regUploading && <span className="text-[10px] text-text-secondary animate-pulse">Uploading...</span>}
              </div>
              {regImageUrl && (
                <span className="text-[10px] text-green-600 block mt-1 truncate">Uploaded successfully!</span>
              )}
            </div>
          </div>
          <button type="submit" className="rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt">
            Save Employee
          </button>
        </form>
      )}

      {/* Main Staff Dashboard Layout - Full Width Directory Table */}
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-lg border-t border-x border-surface-low">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={pag.search}
              onChange={(e) => pag.setSearch(e.target.value)}
              placeholder="Search staff by username/name/phone..."
              className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary"
            />
            <span className="absolute left-3 top-2.5 text-text-secondary">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
          {pag.loading && (
            <span className="text-xs text-brand-blue animate-pulse">Loading...</span>
          )}
        </div>

        {/* Directory Table */}
        <div className="rounded-b-lg bg-white border-x border-b border-surface-low overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
              <tr>
                <th className="px-4 py-2">Name</th>
                {renderSortHeader('Role', 'role')}
                {renderSortHeader('Salary', 'basic_salary')}
                <th className="px-4 py-2">Total Paid</th>
                <th className="px-4 py-2">Advance Balance</th>
                <th className="px-4 py-2">Attendance (Month)</th>
                <th className="px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-low">
              {pag.data.map((emp) => (
                <tr 
                  key={emp.id} 
                  onClick={() => handleSelectEmployee(emp)}
                  className="hover:bg-surface-bright cursor-pointer"
                >
                  <td className="px-4 py-3 text-text-primary">
                    <div className="flex items-center space-x-3">
                      {emp.image_url ? (
                        <img 
                          src={emp.image_url} 
                          alt="" 
                          className="h-8 w-8 rounded-full object-cover border border-surface-dim"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center font-bold text-brand-blue text-xs uppercase">
                          {(emp.user?.first_name?.[0] || '') + (emp.user?.last_name?.[0] || '') || emp.user?.username?.[0] || '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-brand-blue">{emp.user?.first_name} {emp.user?.last_name}</div>
                        <div className="text-[10px] text-text-secondary">@{emp.user?.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-primary font-medium">
                    {emp.role}
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-primary">
                    {formatCurrency(emp.basic_salary)}
                  </td>
                  <td className="px-4 py-3 text-green-700 font-semibold">
                    {formatCurrency(emp.total_salary_paid)}
                  </td>
                  <td className="px-4 py-3 text-error font-semibold">
                    {formatCurrency(emp.outstanding_advance)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-primary">
                    {emp.monthly_attendance}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={emp.is_active}
                        onChange={() => toggleStatus(emp)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </td>
                </tr>
              ))}
              {pag.data.length === 0 && !pag.loading && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-text-secondary">No staff members found.</td>
                </tr>
              )}
            </tbody>
          </table>

          <PaginationControls
            page={pag.page}
            setPage={pag.setPage}
            pageSize={pag.pageSize}
            setPageSize={pag.setPageSize}
            totalCount={pag.totalCount}
            totalPages={pag.totalPages}
          />
        </div>
      </div>
    </div>
  );
}
