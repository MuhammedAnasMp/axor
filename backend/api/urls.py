from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, EmployeeViewSet, CategoryViewSet, BrandViewSet, ProductViewSet, StockViewSet, StockHistoryViewSet,
    SupplierViewSet, CustomerViewSet, BankAccountViewSet, MoneyTransferViewSet, IncomeViewSet,
    ExpenseCategoryViewSet, ExpenseViewSet, PurchaseViewSet, SupplierPaymentViewSet, SaleViewSet,
    CustomerPaymentViewSet, SupplierProductViewSet, SupplierCostHistoryViewSet, dashboard_metrics, reports_data,
    EmployeeSalaryPaymentViewSet, EmployeeAdvanceViewSet, EmployeeAttendanceViewSet, check_ota_update, serve_ota_download
)

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'brands', BrandViewSet, basename='brand')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'stocks', StockViewSet, basename='stock')
router.register(r'stock-history', StockHistoryViewSet, basename='stockhistory')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'supplier-products', SupplierProductViewSet, basename='supplierproduct')
router.register(r'supplier-cost-history', SupplierCostHistoryViewSet, basename='suppliercosthistory')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'bank-accounts', BankAccountViewSet, basename='bankaccount')
router.register(r'money-transfers', MoneyTransferViewSet, basename='moneytransfer')
router.register(r'incomes', IncomeViewSet, basename='income')
router.register(r'expense-categories', ExpenseCategoryViewSet, basename='expensecategory')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'purchases', PurchaseViewSet, basename='purchase')
router.register(r'supplier-payments', SupplierPaymentViewSet, basename='supplierpayment')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'customer-payments', CustomerPaymentViewSet, basename='customerpayment')
router.register(r'employee-salary-payments', EmployeeSalaryPaymentViewSet, basename='employeesalarypayment')
router.register(r'employee-advances', EmployeeAdvanceViewSet, basename='employeeadvance')
router.register(r'employee-attendances', EmployeeAttendanceViewSet, basename='employeeattendance')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/metrics/', dashboard_metrics, name='dashboard-metrics'),
    path('dashboard/reports/', reports_data, name='dashboard-reports'),
    path('ota/check/', check_ota_update, name='ota-check'),
    path('ota/download/<str:version>/', serve_ota_download, name='ota-download'),
]
