export const getBaseUrl = () => {
  const isTestDevice = localStorage.getItem('is_test_device') === 'true';
  if (isTestDevice) {
    // Sanitize any malformed URLs stored in localStorage from previous builds
    const storedLocal = localStorage.getItem('local_api_url');
    if (storedLocal && (storedLocal.includes(':3000/') || !storedLocal.startsWith('http'))) {
      localStorage.removeItem('local_api_url');
    }
    const storedProd = localStorage.getItem('production_api_url');
    if (storedProd && !storedProd.startsWith('http')) {
      localStorage.removeItem('production_api_url');
    }

    const activeMode = localStorage.getItem('active_api_mode') || 'local';
    if (activeMode === 'production') {
      return localStorage.getItem('production_api_url') || 'https://axonbackend.pythonanywhere.com/api';
    } else {
      return localStorage.getItem('local_api_url') || 'http://172.16.4.167:8001/api';
    }
  }
  return import.meta.env.VITE_API_URL || 'http://172.16.4.167:8001/api';
};

// Helper to get CSRF token from cookies (if needed)
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export const request = async (endpoint, options = {}) => {
  const baseUrl = getBaseUrl();
  let url = `${baseUrl}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  // Setup default headers
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  const csrftoken = getCookie('csrftoken');
  if (csrftoken) {
    headers.append('X-CSRFToken', csrftoken);
  }

  // Support auth headers if token-based, but we use Session auth.
  // We'll set credentials to 'include' to pass Django session cookies.
  const config = {
    credentials: 'omit', // We'll use cross-origin credentials or simply session-based (include) if same-origin,
    // actually, let's use 'include' so session cookies are sent back and forth!
    credentials: 'include',
    headers,
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      let errorMsg = errData.error || errData.detail;
      if (!errorMsg) {
        const firstField = Object.keys(errData)[0];
        if (firstField) {
          const fieldErr = errData[firstField];
          const rawMsg = Array.isArray(fieldErr) ? fieldErr[0] : fieldErr;
          errorMsg = firstField === 'non_field_errors' ? rawMsg : `${firstField}: ${rawMsg}`;
        }
      }
      throw new Error(errorMsg || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error(`API Request Error [${endpoint}]:`, error);
    throw error;
  }
};

export const api = {
  auth: {
    login: (username, password) => request('/auth/login/', { method: 'POST', body: { username, password } }),
    logout: () => request('/auth/logout/', { method: 'POST' }),
    me: () => request('/auth/me/'),
    register: (data) => request('/auth/register/', { method: 'POST', body: data }),
  },
  employees: {
    list: (params) => request('/employees/', { params }),
    update: (id, data) => request(`/employees/${id}/`, { method: 'PATCH', body: data }),
    payrollSummary: (id) => request(`/employees/${id}/payroll_summary/`),
  },
  categories: {
    list: (params) => request('/categories/', { params }),
    create: (data) => request('/categories/', { method: 'POST', body: data }),
    delete: (id) => request(`/categories/${id}/`, { method: 'DELETE' }),
  },
  brands: {
    list: (params) => request('/brands/', { params }),
    create: (data) => request('/brands/', { method: 'POST', body: data }),
    delete: (id) => request(`/brands/${id}/`, { method: 'DELETE' }),
  },
  products: {
    list: (params) => request('/products/', { params }),
    create: (data) => request('/products/', { method: 'POST', body: data }),
    update: (id, data) => request(`/products/${id}/`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/products/${id}/`, { method: 'DELETE' }),
  },
  stocks: {
    list: (params) => request('/stocks/', { params }),
    transfer: (data) => request('/stocks/transfer/', { method: 'POST', body: data }),
    adjust: (data) => request('/stocks/adjust/', { method: 'POST', body: data }),
    damage: (data) => request('/stocks/damage/', { method: 'POST', body: data }),
  },
  stockHistory: {
    list: (params) => request('/stock-history/', { params }),
  },
  suppliers: {
    list: (params) => request('/suppliers/', { params }),
    create: (data) => request('/suppliers/', { method: 'POST', body: data }),
    update: (id, data) => request(`/suppliers/${id}/`, { method: 'PATCH', body: data }),
    receivePayment: (id, data) => request(`/suppliers/${id}/receive_payment/`, { method: 'POST', body: data }),
  },
  supplierProducts: {
    list: (params) => request('/supplier-products/', { params }),
    create: (data) => request('/supplier-products/', { method: 'POST', body: data }),
    update: (id, data) => request(`/supplier-products/${id}/`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/supplier-products/${id}/`, { method: 'DELETE' }),
  },
  supplierCostHistory: {
    list: (params) => request('/supplier-cost-history/', { params }),
  },
  customers: {
    list: (params) => request('/customers/', { params }),
    create: (data) => request('/customers/', { method: 'POST', body: data }),
    update: (id, data) => request(`/customers/${id}/`, { method: 'PATCH', body: data }),
  },
  bankAccounts: {
    list: (params) => request('/bank-accounts/', { params }),
    create: (data) => request('/bank-accounts/', { method: 'POST', body: data }),
    transfer: (data) => request('/bank-accounts/transfer/', { method: 'POST', body: data }),
  },
  transfers: {
    list: (params) => request('/money-transfers/', { params }),
  },
  incomes: {
    list: (params) => request('/incomes/', { params }),
    create: (data) => request('/incomes/', { method: 'POST', body: data }),
  },
  expenseCategories: {
    list: (params) => request('/expense-categories/', { params }),
    create: (data) => request('/expense-categories/', { method: 'POST', body: data }),
  },
  expenses: {
    list: (params) => request('/expenses/', { params }),
    create: (data) => request('/expenses/', { method: 'POST', body: data }),
  },
  purchases: {
    list: (params) => request('/purchases/', { params }),
    create: (data) => request('/purchases/', { method: 'POST', body: data }),
    receive: (id, body) => request(`/purchases/${id}/receive/`, { method: 'POST', body }),
    return: (id, body) => request(`/purchases/${id}/return_purchase/`, { method: 'POST', body }),
    delete: (id) => request(`/purchases/${id}/`, { method: 'DELETE' }),
  },
  supplierPayments: {
    list: (params) => request('/supplier-payments/', { params }),
    create: (data) => request('/supplier-payments/', { method: 'POST', body: data }),
  },
  sales: {
    list: (params) => request('/sales/', { params }),
    create: (data) => request('/sales/', { method: 'POST', body: data }),
    return: (id) => request(`/sales/${id}/return_sale/`, { method: 'POST' }),
  },
  customerPayments: {
    list: (params) => request('/customer-payments/', { params }),
    create: (data) => request('/customer-payments/', { method: 'POST', body: data }),
  },
  employeeSalaryPayments: {
    list: (params) => request('/employee-salary-payments/', { params }),
    create: (data) => request('/employee-salary-payments/', { method: 'POST', body: data }),
    reverse: (id) => request(`/employee-salary-payments/${id}/reverse_payroll/`, { method: 'POST' }),
    edit: (id, data) => request(`/employee-salary-payments/${id}/edit_payroll/`, { method: 'POST', body: data }),
    auditTrail: (id) => request(`/employee-salary-payments/${id}/audit_trail/`),
  },
  employeeAdvances: {
    list: (params) => request('/employee-advances/', { params }),
    create: (data) => request('/employee-advances/', { method: 'POST', body: data }),
    reverse: (id) => request(`/employee-advances/${id}/reverse_advance/`, { method: 'POST' }),
  },
  employeeAttendances: {
    list: (params) => request('/employee-attendances/', { params }),
    bulkMark: (data) => request('/employee-attendances/bulk_mark/', { method: 'POST', body: data }),
  },
  dashboard: {
    metrics: () => request('/dashboard/metrics/'),
    reports: () => request('/dashboard/reports/'),
  }
};
