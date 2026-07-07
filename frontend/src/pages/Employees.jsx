import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { usePagination } from '../utils/usePagination';
import PaginationControls from '../components/PaginationControls';
import { SkeletonTable, Spinner, SkeletonForm, SkeletonText } from '../components/Skeleton';
import FloatingActionButton from '../components/FloatingActionButton';
import MobileBottomSheet from '../components/MobileBottomSheet';

export default function Employees() {
  const fileInputRef = useRef(null);
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

  const [isRegistering, setIsRegistering] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileReg, setShowMobileReg] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [activeActionForm, setActiveActionForm] = useState(null); // 'payroll', 'advance', null

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAdvance, setIsSavingAdvance] = useState(false);
  const [isSavingPayroll, setIsSavingPayroll] = useState(false);
  const [isSavingEditPayroll, setIsSavingEditPayroll] = useState(false);

  // Selected Employee & Detail summary states
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);

  // Detail view navigation tab state
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Profile';
  const period = searchParams.get('period') || sessionStorage.getItem('period_employees') || 'all';

  useEffect(() => {
    if (!searchParams.has('period')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('period', period);
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, period, setSearchParams]);

  useEffect(() => {
    const urlPeriod = searchParams.get('period');
    if (urlPeriod) {
      sessionStorage.setItem('period_employees', urlPeriod);
    }
  }, [searchParams]);
  const setActiveTab = (tabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    });
  };
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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
  const [selectedAdvanceDetails, setSelectedAdvanceDetails] = useState(null);
  const [selectedPayrollDetails, setSelectedPayrollDetails] = useState(null);

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
    api.employees.payrollSummary(empId, { period })
      .then((data) => {
        setSummary(data);
        setSummaryLoading(false);
      })
      .catch((err) => {
        alert('Error loading payroll summary: ' + err.message);
        setSummaryLoading(false);
      });
  };

  useEffect(() => {
    if (selectedEmployee) {
      loadSummary(selectedEmployee.id);
    }
  }, [selectedEmployee?.id, period]);

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
    setSelectedAdvanceDetails(null);
    setSelectedPayrollDetails(null);
    setActiveTab('Profile');
    setIsEditingProfile(false);
    loadSummary(emp.id);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
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
        setIsSavingProfile(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsSavingProfile(false);
      });
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
    setIsRegistering(true);
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
        setShowMobileReg(false);
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
        setIsRegistering(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsRegistering(false);
      });
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
    setIsSavingAdvance(true);
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
        setIsSavingAdvance(false);
        setActiveActionForm(null);
      })
      .catch((err) => {
        alert(err.message);
        setIsSavingAdvance(false);
      });
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
    setIsSavingPayroll(true);
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
        setIsSavingPayroll(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsSavingPayroll(false);
      });
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
    setIsSavingEditPayroll(true);
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
        setIsSavingEditPayroll(false);
      })
      .catch((err) => {
        alert(err.message);
        setIsSavingEditPayroll(false);
      });
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
        className="px-4 py-4 cursor-pointer hover:bg-surface-low select-none transition-colors"
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
      <div className="space-y-6 pb-20 md:pb-0">

        {isMobile && (
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-surface-low shadow-sm gap-2">
            <button
              onClick={() => {
                setSelectedEmployee(null);
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete('tab');
                  return next;
                });
              }}
              className="flex items-center space-x-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-1">
              {!period.startsWith('custom_') ? (
                <select
                  value={period}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextParams = new URLSearchParams(searchParams);
                    if (val === 'custom') {
                      const todayStr = new Date().toISOString().split('T')[0];
                      nextParams.set('period', `custom_${todayStr}_${todayStr}`);
                    } else {
                      nextParams.set('period', val);
                    }
                    setSearchParams(nextParams);
                  }}
                  className="rounded border border-surface-dim bg-white px-1.5 py-0.5 text-[10px] font-semibold text-text-primary outline-none focus:border-brand-blue"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom...</option>
                </select>
              ) : (() => {
                const parts = period.split('_');
                const startDate = parts[1] || '';
                const endDate = parts[2] || '';
                return (
                  <div className="flex items-center space-x-1 animate-in fade-in duration-150">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        const nextParams = new URLSearchParams(searchParams);
                        nextParams.set('period', `custom_${e.target.value}_${endDate}`);
                        setSearchParams(nextParams);
                      }}
                      className="rounded border border-surface-dim bg-white px-1 py-0.5 text-[9px] text-text-primary outline-none focus:border-brand-blue w-20"
                    />
                    <span className="text-[9px] text-text-secondary">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        const nextParams = new URLSearchParams(searchParams);
                        nextParams.set('period', `custom_${startDate}_${e.target.value}`);
                        setSearchParams(nextParams);
                      }}
                      className="rounded border border-surface-dim bg-white px-1 py-0.5 text-[9px] text-text-primary outline-none focus:border-brand-blue w-20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextParams = new URLSearchParams(searchParams);
                        nextParams.set('period', 'today');
                        setSearchParams(nextParams);
                      }}
                      className="rounded-full hover:bg-surface-low p-0.5 text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
                      title="Clear custom range"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })()}
            </div>
            <div className="text-[10px] text-text-secondary">
              Employee: <span className="font-bold text-brand-blue">@{selectedEmployee.user?.username}</span>
            </div>
          </div>
        )}

        {!isMobile && (
          <div className="flex items-center justify-between border-b border-surface-low pb-2 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center space-x-6 text-sm font-medium">
              <button
                onClick={() => {
                  setSelectedEmployee(null);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('tab');
                    return next;
                  });
                }}
                className="flex items-center space-x-1 text-text-secondary hover:text-text-primary transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back</span>
              </button>
              <span className="text-surface-dim">|</span>
              {[
                { id: 'Profile', label: 'Profile' },
                { id: 'Attendance', label: 'Attendance' },
                { id: 'Advances', label: 'Advances' },
                { id: 'Payroll', label: 'Payroll' }
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-2 transition-all ${active ? 'border-b-2 border-brand-blue text-brand-blue font-bold' : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="detail-period-select" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Period:</label>
                {!period.startsWith('custom_') ? (
                  <select
                    id="detail-period-select"
                    value={period}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextParams = new URLSearchParams(searchParams);
                      if (val === 'custom') {
                        const todayStr = new Date().toISOString().split('T')[0];
                        nextParams.set('period', `custom_${todayStr}_${todayStr}`);
                      } else {
                        nextParams.set('period', val);
                      }
                      setSearchParams(nextParams);
                    }}
                    className="rounded border border-surface-dim bg-white px-2.5 py-1 text-xs font-semibold text-text-primary outline-none focus:border-brand-blue shadow-xs cursor-pointer"
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="all">All Time</option>
                    <option value="custom">Custom Range...</option>
                  </select>
                ) : (() => {
                  const parts = period.split('_');
                  const startDate = parts[1] || '';
                  const endDate = parts[2] || '';
                  return (
                    <div className="flex items-center space-x-1.5 animate-in fade-in duration-150">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          const nextParams = new URLSearchParams(searchParams);
                          nextParams.set('period', `custom_${e.target.value}_${endDate}`);
                          setSearchParams(nextParams);
                        }}
                        className="rounded border border-surface-dim bg-white px-2 py-1 text-xs text-text-primary outline-none focus:border-brand-blue"
                      />
                      <span className="text-xs text-text-secondary">to</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          const nextParams = new URLSearchParams(searchParams);
                          nextParams.set('period', `custom_${startDate}_${e.target.value}`);
                          setSearchParams(nextParams);
                        }}
                        className="rounded border border-surface-dim bg-white px-2 py-1 text-xs text-text-primary outline-none focus:border-brand-blue"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextParams = new URLSearchParams(searchParams);
                          nextParams.set('period', 'today');
                          setSearchParams(nextParams);
                        }}
                        className="rounded-full hover:bg-surface-low p-1 text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
                        title="Clear custom range"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })()}
              </div>
              <div className="text-xs text-text-secondary">
                Selected Employee: <span className="font-bold text-brand-blue">@{selectedEmployee.user?.username}</span>
              </div>
            </div>
          </div>
        )}

        {summaryLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 rounded-lg bg-white p-6 border border-surface-low space-y-6">
                <SkeletonForm fields={4} />
              </div>
              <div className="rounded-lg bg-white p-6 border border-surface-low space-y-4">
                <SkeletonText lines={6} />
              </div>
            </div>
          </div>
        ) : (
          summary && (
            <div className="space-y-6">
              {/* Profile & Salary Tab (Combined with Advances) */}
              {activeTab === 'Profile' && (
                <div className="space-y-6">
                  {/* Salary Settings and Financial Totals grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <form onSubmit={(e) => { handleSaveProfile(e); setIsEditingProfile(false); }} className="md:col-span-2 rounded-lg bg-white p-4 sm:p-6 shadow-sm border border-surface-low space-y-4 sm:space-y-6">
                      {/* Profile header with Edit button */}
                      <div className="flex flex-col items-center justify-center space-y-3 pb-6 border-b border-surface-low relative">
                        {/* Edit / Cancel button top-right */}
                        {!isEditingProfile ? (
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(true)}
                            className="absolute top-0 right-0 flex items-center space-x-1 rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 text-[11px] font-semibold text-brand-blue hover:bg-brand-blue/10 transition"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        ) : (
                          <div className="absolute top-0 right-0 flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingProfile(false);
                                // Reset to original values
                                setProfileFirstName(selectedEmployee.user?.first_name || '');
                                setProfileLastName(selectedEmployee.user?.last_name || '');
                                setProfileUsername(selectedEmployee.user?.username || '');
                                setProfilePassword('');
                                setProfileEmail(selectedEmployee.user?.email || '');
                                setProfilePhone(selectedEmployee.phone || '');
                                setProfileRole(selectedEmployee.role || 'Cashier');
                                setProfileImageUrl(selectedEmployee.image_url || '');
                                setBasicSalaryInput(selectedEmployee.basic_salary);
                              }}
                              className="rounded-lg border border-surface-dim bg-white px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:bg-surface-low transition"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        <div
                          onClick={() => isEditingProfile && fileInputRef.current?.click()}
                          className={`relative h-24 w-24 rounded-full transition-all group ${isEditingProfile ? 'cursor-pointer hover:opacity-90 active:scale-95' : 'cursor-default'}`}
                          title={isEditingProfile ? 'Click to upload profile photo' : ''}
                        >
                          {profileImageUrl ? (
                            <img
                              src={profileImageUrl}
                              alt="Profile Preview"
                              className="h-full w-full rounded-full object-cover border-2 border-brand-blue"
                              onError={(e) => {
                                e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'>No Image</text></svg>";
                              }}
                            />
                          ) : (
                            <div className="h-full w-full rounded-full bg-brand-blue/10 border-2 border-brand-blue/20 flex items-center justify-center font-bold text-brand-blue text-2xl uppercase">
                              {(profileFirstName?.[0] || '') + (profileLastName?.[0] || '') || profileUsername?.[0] || '?'}
                            </div>
                          )}
                          {/* Upload overlay hover indicator - only in edit mode */}
                          {isEditingProfile && (
                            <div className="absolute inset-0 bg-black/35 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                          )}
                          {profileUploading && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white text-[9px] font-semibold">
                              <Spinner size="xs" />
                              <span className="mt-1">Uploading...</span>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="hidden"
                        />
                        {profileImageUrl && !profileUploading && <span className="text-[10px] text-green-600 font-semibold">✓ Image Uploaded</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-text-secondary mb-0.5 sm:mb-1">First Name</label>
                          <input
                            type="text"
                            value={profileFirstName}
                            onChange={(e) => setProfileFirstName(e.target.value)}
                            disabled={!isEditingProfile}
                            className={`w-full rounded border px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs outline-none transition ${isEditingProfile ? 'border-surface-dim bg-white focus:border-brand-blue' : 'border-transparent bg-surface text-text-secondary cursor-default'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-text-secondary mb-0.5 sm:mb-1">Last Name</label>
                          <input
                            type="text"
                            value={profileLastName}
                            onChange={(e) => setProfileLastName(e.target.value)}
                            disabled={!isEditingProfile}
                            className={`w-full rounded border px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs outline-none transition ${isEditingProfile ? 'border-surface-dim bg-white focus:border-brand-blue' : 'border-transparent bg-surface text-text-secondary cursor-default'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-text-secondary mb-0.5 sm:mb-1">Username</label>
                          <input
                            type="text"
                            required
                            value={profileUsername}
                            onChange={(e) => setProfileUsername(e.target.value.toLowerCase())}
                            disabled={!isEditingProfile}
                            className={`w-full rounded border px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs outline-none transition ${isEditingProfile ? 'border-surface-dim bg-white focus:border-brand-blue' : 'border-transparent bg-surface text-text-secondary cursor-default'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-text-secondary mb-0.5 sm:mb-1">Password {!isEditingProfile && '(hidden)'}</label>
                          <input
                            type="password"
                            value={isEditingProfile ? profilePassword : '••••••••'}
                            onChange={(e) => setProfilePassword(e.target.value)}
                            placeholder="Leave blank to keep current"
                            disabled={!isEditingProfile}
                            className={`w-full rounded border px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs outline-none transition ${isEditingProfile ? 'border-surface-dim bg-white focus:border-brand-blue' : 'border-transparent bg-surface text-text-secondary cursor-default'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-text-secondary mb-0.5 sm:mb-1">Email</label>
                          <input
                            type="email"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            disabled={!isEditingProfile}
                            className={`w-full rounded border px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs outline-none transition ${isEditingProfile ? 'border-surface-dim bg-white focus:border-brand-blue' : 'border-transparent bg-surface text-text-secondary cursor-default'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-text-secondary mb-0.5 sm:mb-1">Phone</label>
                          <input
                            type="text"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            disabled={!isEditingProfile}
                            className={`w-full rounded border px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs outline-none transition ${isEditingProfile ? 'border-surface-dim bg-white focus:border-brand-blue' : 'border-transparent bg-surface text-text-secondary cursor-default'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-text-secondary mb-0.5 sm:mb-1">Role</label>
                          <select
                            value={profileRole}
                            onChange={(e) => setProfileRole(e.target.value)}
                            disabled={!isEditingProfile}
                            className={`w-full rounded border px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs outline-none transition ${isEditingProfile ? 'border-surface-dim bg-white focus:border-brand-blue' : 'border-transparent bg-surface text-text-secondary cursor-default'}`}
                          >
                            <option value="Owner">Owner</option>
                            <option value="Manager">Manager</option>
                            <option value="Cashier">Cashier</option>
                            <option value="Store Keeper">Store Keeper</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-text-secondary mb-0.5 sm:mb-1">Basic Salary</label>
                          <input
                            type="number"
                            value={basicSalaryInput}
                            onChange={(e) => setBasicSalaryInput(e.target.value)}
                            disabled={!isEditingProfile}
                            className={`w-full rounded border px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs outline-none transition ${isEditingProfile ? 'border-surface-dim bg-white focus:border-brand-blue' : 'border-transparent bg-surface text-text-secondary cursor-default'}`}
                          />
                        </div>
                      </div>
                      {/* Save button only in edit mode */}
                      {isEditingProfile && (
                        <div className="border-t border-surface-low pt-4 flex justify-end">
                          <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="rounded bg-brand-blue px-4 py-2 text-xs font-bold text-white hover:bg-brand-cobalt transition flex items-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
                          >
                            {isSavingProfile && <Spinner size="xs" />}
                            <span>{isSavingProfile ? 'Saving...' : 'Save Profile & Salary Settings'}</span>
                          </button>
                        </div>
                      )}
                    </form>

                    <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low bg-transparent border-none shadow-none space-y-4">
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

                </div>
              )}

              {/* Advances Tab */}
              {activeTab === 'Advances' && (
                <div className="space-y-6">
                  {/* Header with trigger button */}
                  <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-surface-low">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">Salary Advance History</h3>
                      <p className="text-[11px] text-text-secondary">View past advances or issue a new one.</p>
                    </div>
                    <button
                      onClick={() => setActiveActionForm('advance')}
                      className="hidden md:block rounded bg-brand-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-cobalt transition"
                    >
                      Issue Advance
                    </button>
                  </div>

                  {/* Advance History */}
                  <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low bg-transparent border-none shadow-none space-y-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                          <tr>
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Amount</th>
                            <th className="hidden sm:table-cell px-3 py-2">Paid From</th>
                            <th className="hidden sm:table-cell px-3 py-2">Description</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="hidden sm:table-cell px-3 py-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-low">
                          {summary.advance_history.map((adv) => (
                            <tr
                              key={adv.id}
                              onClick={() => {
                                if (isMobile) {
                                  setSelectedAdvanceDetails(adv);
                                }
                              }}
                              className="hover:bg-surface-bright cursor-pointer sm:cursor-default"
                            >
                              <td className="px-3 py-2.5 font-semibold text-text-primary">
                                {new Date(adv.timestamp).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2.5 font-semibold text-text-primary">
                                {formatCurrency(adv.amount)}
                              </td>
                              <td className="hidden sm:table-cell px-3 py-2.5">
                                {adv.paid_from_name || 'N/A'}
                              </td>
                              <td className="hidden sm:table-cell px-3 py-2.5 max-w-xs truncate" title={adv.description}>
                                {adv.description || '-'}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-block rounded px-1.5 py-0.5 text-[8px] font-bold ${adv.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  adv.status === 'Deducted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                  {adv.status}
                                </span>
                              </td>
                              <td className="hidden sm:table-cell px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
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
              )}

              {/* Attendance Tab */}
              {activeTab === 'Attendance' && (
                <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low bg-transparent border-none shadow-none space-y-4">
                  <h3 className="text-sm font-semibold text-text-primary border-b border-surface-low pb-2">Monthly Attendance Calendar</h3>
                  {renderCalendar()}
                </div>
              )}

              {/* Payroll Tab */}
              {activeTab === 'Payroll' && (
                <div className="space-y-6">


                  {/* Edit Payroll Inline Form (Desktop only) */}
                  {!isMobile && editingPayroll && (
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
                          disabled={isSavingEditPayroll}
                          className="rounded bg-yellow-600 px-4 py-2 text-xs font-bold text-white hover:bg-yellow-700 transition flex items-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {isSavingEditPayroll && <Spinner size="xs" />}
                          <span>{isSavingEditPayroll ? 'Recalculating...' : 'Recalculate & Save'}</span>
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
                  <div className="md:rounded-lg md:bg-white p-0 md:p-6 md:shadow-sm md:border md:border-surface-low bg-transparent border-none shadow-none space-y-4">
                    <div className="flex justify-between items-center border-b border-surface-low pb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary">Salary Payments History</h3>
                        <p className="text-[11px] text-text-secondary">View payroll payments history or process new payroll.</p>
                      </div>
                      <button
                        onClick={() => setActiveActionForm('payroll')}
                        className="hidden md:block rounded bg-brand-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-cobalt transition"
                      >
                        Process Payroll
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                          <tr>
                            <th className="px-3 py-2">Paid Date</th>
                            <th className="hidden sm:table-cell px-3 py-2">Basic</th>
                            <th className="hidden sm:table-cell px-3 py-2">Allowance</th>
                            <th className="hidden sm:table-cell px-3 py-2">Deductions</th>
                            <th className="px-3 py-2">Net Paid</th>
                            <th className="hidden sm:table-cell px-3 py-2">Paid From</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="hidden sm:table-cell px-3 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-low">
                          {summary.payroll_history.map((pay) => (
                            <tr
                              key={pay.id}
                              onClick={() => {
                                if (isMobile) {
                                  setSelectedPayrollDetails(pay);
                                }
                              }}
                              className="hover:bg-surface-bright cursor-pointer sm:cursor-default"
                            >
                              <td className="px-3 py-2.5 font-semibold text-text-primary">
                                {new Date(pay.timestamp).toLocaleDateString()}
                              </td>
                              <td className="hidden sm:table-cell px-3 py-2.5">{formatCurrency(pay.basic_salary)}</td>
                              <td className="hidden sm:table-cell px-3 py-2.5">{formatCurrency(pay.allowance)}</td>
                              <td className="hidden sm:table-cell px-3 py-2.5 text-error">-{formatCurrency(pay.advance)}</td>
                              <td className="px-3 py-2.5 font-bold text-green-700">{formatCurrency(pay.total_paid)}</td>
                              <td className="hidden sm:table-cell px-3 py-2.5">{pay.paid_from_name || 'N/A'}</td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-semibold ${pay.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                  {pay.status}
                                </span>
                              </td>
                              <td className="hidden sm:table-cell px-3 py-2.5 text-center space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                {pay.status === 'Paid' && (
                                  <>
                                    <button
                                      onClick={() => startEditPayroll(pay)}
                                      className="inline-flex items-center justify-center rounded bg-brand-blue/10 p-1 text-[10px] font-semibold text-brand-blue hover:bg-brand-blue/20 transition"
                                      title="Edit Payroll"
                                    >
                                      <svg className="h-3 w-3 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                      <span className="hidden sm:inline">Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleReversePayroll(pay.id)}
                                      className="inline-flex items-center justify-center rounded bg-error-container/10 p-1 text-[10px] font-semibold text-error hover:bg-error-container/20 transition"
                                      title="Reverse Payroll"
                                    >
                                      <svg className="h-3 w-3 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                      </svg>
                                      <span className="hidden sm:inline">Reverse</span>
                                    </button>
                                  </>
                                )}
                                {/* Audit button removed */}
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

        {/* Mobile Bottom Tab Navigation */}
        {isMobile && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-45 bg-white border-t border-surface-low flex justify-around pt-2 pb-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-pb" style={{ marginBottom: '0px' }}>
            {[
              {
                id: 'Profile',
                label: 'Profile',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )
              },
              {
                id: 'Attendance',
                label: 'Attendance',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                id: 'Advances',
                label: 'Advance',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )
              },
              {
                id: 'Payroll',
                label: 'Payroll',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${active ? 'text-brand-blue' : 'text-text-secondary'
                    }`}
                >
                  <div className={`flex items-center justify-center rounded-2xl px-4 py-1 mb-0.5 transition-colors ${active ? 'bg-accent-blue/15' : 'bg-transparent'
                    }`}>
                    {tab.icon}
                  </div>
                  <span className="text-[9px] font-bold tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Actions FAB Button - shown only on mobile when employee is selected */}
        {isMobile && (
          <div className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              aria-label="Actions menu"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-xl hover:bg-brand-cobalt transition-transform active:scale-95 duration-200"
              style={{ boxShadow: '0px 6px 20px rgba(26, 115, 232, 0.4)' }}
            >
              <svg className={`h-6 w-6 transform transition-transform duration-200 ${showActionMenu ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Action Menu Popover */}
            {showActionMenu && (
              <div className="absolute bottom-16 right-0 w-48 rounded-xl bg-white border border-surface-low shadow-2xl p-2 space-y-1">
                <button
                  onClick={() => {
                    setActiveActionForm('payroll');
                    setShowActionMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-text-primary hover:bg-surface-low rounded-lg transition"
                >
                  💸 Process Payroll
                </button>
                <button
                  onClick={() => {
                    setActiveActionForm('advance');
                    setShowActionMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-text-primary hover:bg-surface-low rounded-lg transition"
                >
                  💰 Issue Salary Advance
                </button>
              </div>
            )}
          </div>
        )}

        {/* Responsive Modal/Sheet for Actions */}
        {(activeActionForm === 'payroll' || activeActionForm === 'advance') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-surface-low animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-low">
                <h3 className="font-bold text-text-primary text-sm">
                  {activeActionForm === 'payroll' ? 'Process Monthly Payroll' : 'Issue Salary Advance'}
                </h3>
                <button
                  onClick={() => setActiveActionForm(null)}
                  className="p-1 rounded-full text-text-secondary hover:bg-surface-low"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                {activeActionForm === 'payroll' ? (
                  <form onSubmit={(e) => { handleProcessPayroll(e); setActiveActionForm(null); }} className="space-y-4 text-left">
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
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Payroll Notes / Description</label>
                      <input
                        type="text"
                        value={payrollDescription}
                        onChange={(e) => setPayrollDescription(e.target.value)}
                        placeholder="E.g., June 2026 Salary"
                        className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="bg-surface p-4 rounded-lg space-y-2 text-xs text-text-primary">
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

                    <button
                      type="submit"
                      disabled={isSavingPayroll}
                      className="w-full rounded bg-brand-blue py-2 text-xs font-bold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSavingPayroll && <Spinner size="xs" />}
                      <span>{isSavingPayroll ? 'Processing...' : 'Approve & Process Payroll'}</span>
                    </button>
                  </form>
                ) : activeActionForm === 'advance' ? (
                  <form onSubmit={handleRequestAdvance} className="space-y-4 text-left">
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
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Description / Notes</label>
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
                      disabled={isSavingAdvance}
                      className="w-full rounded bg-brand-blue py-2 text-xs font-bold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSavingAdvance && <Spinner size="xs" />}
                      <span>{isSavingAdvance ? 'Issuing...' : 'Issue Advance Salary'}</span>
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <MobileBottomSheet
          isOpen={selectedAdvanceDetails !== null}
          onClose={() => setSelectedAdvanceDetails(null)}
          title="Salary Advance Details"
        >
          {selectedAdvanceDetails && (
            <div className="space-y-4 pb-6 text-xs text-text-primary">
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Date:</span>
                <span>{new Date(selectedAdvanceDetails.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Amount:</span>
                <span className="font-bold text-brand-blue">{formatCurrency(selectedAdvanceDetails.amount)}</span>
              </div>
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Paid From:</span>
                <span>{selectedAdvanceDetails.paid_from_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Description:</span>
                <span className="max-w-[200px] break-words text-right">{selectedAdvanceDetails.description || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Status:</span>
                <span className={`inline-block rounded px-1.5 py-0.5 text-[8px] font-bold ${selectedAdvanceDetails.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedAdvanceDetails.status === 'Deducted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {selectedAdvanceDetails.status}
                </span>
              </div>
              {selectedAdvanceDetails.status === 'Pending' && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      handleReverseAdvance(selectedAdvanceDetails.id);
                      setSelectedAdvanceDetails(null);
                    }}
                    className="w-full rounded bg-error py-2 text-xs font-bold text-white hover:bg-error-container transition"
                  >
                    Reverse Advance
                  </button>
                </div>
              )}
            </div>
          )}
        </MobileBottomSheet>

        <MobileBottomSheet
          isOpen={selectedPayrollDetails !== null}
          onClose={() => setSelectedPayrollDetails(null)}
          title="Payroll Record Details"
        >
          {selectedPayrollDetails && (
            <div className="space-y-4 pb-6 text-xs text-text-primary">
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Paid Date:</span>
                <span>{new Date(selectedPayrollDetails.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Basic Salary:</span>
                <span>{formatCurrency(selectedPayrollDetails.basic_salary)}</span>
              </div>
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Allowance:</span>
                <span className="text-green-700">+{formatCurrency(selectedPayrollDetails.allowance)}</span>
              </div>
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Deductions:</span>
                <span className="text-error">-{formatCurrency(selectedPayrollDetails.advance)}</span>
              </div>
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Net Paid:</span>
                <span className="font-bold text-green-700">{formatCurrency(selectedPayrollDetails.total_paid)}</span>
              </div>
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Paid From:</span>
                <span>{selectedPayrollDetails.paid_from_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-surface-low pb-2">
                <span className="font-semibold text-text-secondary">Status:</span>
                <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-semibold ${selectedPayrollDetails.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {selectedPayrollDetails.status}
                </span>
              </div>

              {/* Mobile Actions */}
              <div className="pt-2 space-y-2">
                {selectedPayrollDetails.status === 'Paid' && (
                  <>
                    <button
                      onClick={() => {
                        startEditPayroll(selectedPayrollDetails);
                        setSelectedPayrollDetails(null);
                      }}
                      className="w-full rounded bg-brand-blue py-2 text-xs font-bold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span>Edit Payroll</span>
                    </button>
                    <button
                      onClick={() => {
                        handleReversePayroll(selectedPayrollDetails.id);
                        setSelectedPayrollDetails(null);
                      }}
                      className="w-full rounded bg-error py-2 text-xs font-bold text-white hover:bg-error-container transition flex items-center justify-center space-x-1.5"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span>Reverse Payment</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </MobileBottomSheet>

        <MobileBottomSheet
          isOpen={isMobile && editingPayroll !== null}
          onClose={() => setEditingPayroll(null)}
          title="Edit Processed Payroll"
        >
          {editingPayroll && (
            <form onSubmit={handleEditPayrollSubmit} className="space-y-4 text-left pb-6">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Basic Salary</label>
                <input
                  type="number"
                  required
                  value={editBasicSalary}
                  onChange={(e) => setEditBasicSalary(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Allowance</label>
                <input
                  type="number"
                  required
                  value={editAllowance}
                  onChange={(e) => setEditAllowance(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Paid From</label>
                <select
                  required
                  value={editPaidFrom}
                  onChange={(e) => setEditPaidFrom(e.target.value)}
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
                <label className="block text-xs font-semibold text-text-secondary mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-xs outline-none focus:border-brand-blue"
                />
              </div>
              <div className="flex flex-col space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingEditPayroll}
                  className="w-full rounded bg-brand-blue py-2 text-xs font-bold text-white hover:bg-brand-cobalt transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSavingEditPayroll && <Spinner size="xs" />}
                  <span>{isSavingEditPayroll ? 'Recalculating...' : 'Recalculate & Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPayroll(null)}
                  className="w-full rounded bg-surface-low border border-surface-dim py-2 text-xs text-text-primary hover:bg-surface-dim transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </MobileBottomSheet>
      </div>
    );
  }

  const renderRegisterForm = () => {
    return (
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
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
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
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
        <button
          type="submit"
          disabled={isRegistering}
          className="rounded bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-cobalt transition flex items-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isRegistering && <Spinner size="sm" />}
          <span>{isRegistering ? 'Saving...' : 'Save Employee'}</span>
        </button>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Employees & Roles</h2>
          <p className="text-xs text-text-secondary">Manage staff accounts, assign roles, and review sales leaderboards.</p>
        </div>
      </div>

      {/* Main Staff Dashboard Layout - Full Width Directory Tabl        {/* Search bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:bg-white md:p-4 md:rounded-t-lg md:border-t md:border-x md:border-surface-low bg-transparent p-0 border-none">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={pag.search}
            onChange={(e) => pag.setSearch(e.target.value)}
            placeholder="Search staff by username/name/phone..."
            className="w-full rounded border border-surface-dim bg-white pl-9 pr-3 py-3 md:py-2 text-sm md:text-xs text-text-primary outline-none focus:border-brand-blue placeholder:text-text-secondary search-input-mobile"
          />
          <span className="absolute left-3 top-3.5 md:top-2.5 text-text-secondary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
        {pag.loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-blue border-t-transparent" />
        )}
      </div>

      {/* Directory Table (Desktop) */}
      <div className="hidden md:block rounded-t-lg bg-white border-x border-t border-surface-low overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-low text-text-secondary font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-4">Name</th>
              {renderSortHeader('Role', 'role')}
              {renderSortHeader('Salary', 'basic_salary')}
              <th className="px-4 py-4">Total Paid</th>
              <th className="px-4 py-4">Advance Balance</th>
              <th className="px-4 py-4">Attendance (Month)</th>
              <th className="px-4 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-low">
            {pag.loading ? (
              <SkeletonTable rows={pag.pageSize || 5} columns={7} />
            ) : (
              pag.data.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className="hover:bg-surface-bright cursor-pointer"
                >
                  <td className="px-4 py-4 text-text-primary">
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
                  <td className="px-4 py-4 text-text-primary font-medium">
                    {emp.role}
                  </td>
                  <td className="px-4 py-4 font-semibold text-text-primary">
                    {formatCurrency(emp.basic_salary)}
                  </td>
                  <td className="px-4 py-4 text-green-700 font-semibold">
                    {formatCurrency(emp.total_salary_paid)}
                  </td>
                  <td className="px-4 py-4 text-error font-semibold">
                    {formatCurrency(emp.outstanding_advance)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-text-primary">
                    {emp.monthly_attendance}
                  </td>
                  <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
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
              ))
            )}
            {pag.data.length === 0 && !pag.loading && (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-text-secondary">No staff members found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Directory Card List (Mobile) */}
      <div className="block md:hidden grid grid-cols-2 gap-3">
        {pag.loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="border border-surface-low rounded-2xl p-4 bg-white flex flex-col items-center space-y-3 shadow-sm animate-pulse">
              <div className="h-16 w-16 bg-surface-dim/50 rounded-full" />
              <div className="space-y-2 flex flex-col items-center w-full">
                <div className="h-4 w-24 bg-surface-dim/50 rounded" />
                <div className="h-3.5 w-16 bg-surface-dim/50 rounded" />
                <div className="h-5 w-20 bg-surface-dim/50 rounded-full" />
              </div>
              <div className="w-full border-t border-surface-low pt-3 grid grid-cols-2 gap-2">
                <div className="h-8 bg-surface-dim/50 rounded" />
                <div className="h-8 bg-surface-dim/50 rounded" />
              </div>
            </div>
          ))
        ) : (
          pag.data.map((emp) => (
            <div
              key={emp.id}
              onClick={() => handleSelectEmployee(emp)}
              className="border border-surface-low rounded-2xl p-4 bg-white flex flex-col items-center text-center space-y-3 shadow-sm active:bg-surface-low transition-all hover:shadow-md cursor-pointer relative"
            >
              {/* Active Toggle Switch in corner */}
              <div className="absolute top-2 right-2 flex items-center" onClick={(e) => e.stopPropagation()}>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={emp.is_active}
                    onChange={() => toggleStatus(emp)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Profile Image / Initials */}
              {emp.image_url ? (
                <img
                  src={emp.image_url}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover border-2 border-brand-blue/20"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-brand-blue/10 border-2 border-brand-blue/20 flex items-center justify-center font-bold text-brand-blue text-lg uppercase">
                  {(emp.user?.first_name?.[0] || '') + (emp.user?.last_name?.[0] || '') || emp.user?.username?.[0] || '?'}
                </div>
              )}

              {/* Name & Role */}
              <div className="space-y-1">
                <div className="font-bold text-brand-blue text-xs leading-tight truncate max-w-[130px]" title={`${emp.user?.first_name} ${emp.user?.last_name}`}>
                  {emp.user?.first_name} {emp.user?.last_name}
                </div>
                <div className="text-[10px] text-text-secondary">@{emp.user?.username}</div>
                <span className="inline-block text-[9px] font-bold text-text-primary px-2 py-0.5 rounded-full bg-surface-low border border-surface-dim">
                  {emp.role}
                </span>
              </div>

              {/* Stats grid */}
              <div className="w-full border-t border-surface-low pt-3 grid grid-cols-2 gap-x-2 gap-y-3 text-left">
                <div>
                  <span className="block text-[8px] text-text-secondary uppercase font-semibold">Salary</span>
                  <span className="font-bold text-text-primary text-[10px]">{formatCurrency(emp.basic_salary)}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-text-secondary uppercase font-semibold">Total Paid</span>
                  <span className="font-bold text-green-700 text-[10px]">{formatCurrency(emp.total_salary_paid)}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-text-secondary uppercase font-semibold">Advance</span>
                  <span className="font-bold text-error text-[10px]">{formatCurrency(emp.outstanding_advance)}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-text-secondary uppercase font-semibold">Attendance</span>
                  <span className="font-bold text-text-primary text-[10px]">{emp.monthly_attendance}</span>
                </div>
              </div>
            </div>
          ))
        )}
        {pag.data.length === 0 && !pag.loading && (
          <div className="col-span-2 p-8 text-center text-text-secondary bg-white rounded-xl border border-surface-low">
            No staff members found.
          </div>
        )}
      </div>

      {/* Pagination Controls (Shared) */}
      <div className="bg-white border-x border-b border-surface-low rounded-b-lg p-4 mb-20 md:mb-0">
        <PaginationControls
          page={pag.page}
          setPage={pag.setPage}
          pageSize={pag.pageSize}
          setPageSize={pag.setPageSize}
          totalCount={pag.totalCount}
          totalPages={pag.totalPages}
          loading={pag.loading}
        />
      </div>


      {/* Mobile Floating Action Button */}
      {isMobile && !selectedEmployee && !showMobileReg && (
        <FloatingActionButton
          onClick={() => setShowMobileReg(true)}
          label="Register Employee"
        />
      )}

      {/* Mobile Bottom Sheet Register Form */}
      <MobileBottomSheet
        isOpen={showMobileReg}
        onClose={() => setShowMobileReg(false)}
        title="Register Employee"
      >
        <div className="pb-6">
          {renderRegisterForm()}
        </div>
      </MobileBottomSheet>
    </div>
  );
}
