from django.contrib import admin
from .models import (
    Employee,
    Category,
    Brand,
    MobileModel,
    Product,
    Stock,
    StockHistory,
    Supplier,
    Customer,
    BankAccount,
    MoneyTransfer,
    Income,
    ExpenseCategory,
    Expense,
    Purchase,
    PurchaseItem,
    SupplierPayment,
    Sale,
    SaleItem,
    CustomerPayment,
    EmployeeAttendance,
    PurchaseReturn,
    PurchaseReturnItem,
    OTAUpdateBundle
)

# --- Inlines ---

class StockInline(admin.StackedInline):
    model = Stock
    extra = 0
    can_delete = False


class PurchaseItemInline(admin.TabularInline):
    model = PurchaseItem
    extra = 1


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1


# --- Admin Registrations ---

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone', 'sales_performance', 'is_active')
    list_filter = ('role', 'is_active')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'phone')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'barcode', 'category', 'brand', 'selling_price', 'average_cost', 'status')
    list_filter = ('status', 'category', 'brand')
    search_fields = ('name', 'barcode')
    inlines = [StockInline]


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity')
    search_fields = ('product__name', 'product__barcode')


@admin.register(StockHistory)
class StockHistoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity_changed', 'action_type', 'timestamp')
    list_filter = ('action_type', 'timestamp')
    search_fields = ('product__name', 'description')


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'outstanding_balance')
    search_fields = ('name',)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'credit_limit', 'outstanding_balance')
    search_fields = ('name',)


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'balance')
    search_fields = ('name',)


@admin.register(MoneyTransfer)
class MoneyTransferAdmin(admin.ModelAdmin):
    list_display = ('source_account', 'dest_account', 'amount', 'timestamp')
    list_filter = ('timestamp',)


@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ('source', 'amount', 'payment_method', 'supplier', 'timestamp')
    list_filter = ('payment_method', 'timestamp')
    search_fields = ('source', 'description')


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('category', 'amount', 'payment_source', 'is_recurring', 'timestamp')
    list_filter = ('is_recurring', 'category', 'payment_source', 'timestamp')


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ('id', 'supplier', 'invoice_number', 'total_amount', 'payment_type', 'is_received', 'timestamp')
    list_filter = ('payment_type', 'is_received', 'timestamp')
    search_fields = ('invoice_number', 'supplier__name')
    inlines = [PurchaseItemInline]


@admin.register(PurchaseItem)
class PurchaseItemAdmin(admin.ModelAdmin):
    list_display = ('purchase', 'product', 'quantity', 'purchase_cost', 'new_selling_price')
    search_fields = ('product__name', 'purchase__invoice_number')


@admin.register(SupplierPayment)
class SupplierPaymentAdmin(admin.ModelAdmin):
    list_display = ('supplier', 'payment_from', 'amount', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('supplier__name',)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'customer', 'employee', 'payment_type', 'total_amount', 'profit', 'timestamp')
    list_filter = ('payment_type', 'timestamp')
    search_fields = ('invoice_number', 'customer__name', 'employee__user__username')
    inlines = [SaleItemInline]


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ('sale', 'product', 'quantity', 'unit_price', 'cost_at_sale')
    search_fields = ('product__name', 'sale__invoice_number')


@admin.register(CustomerPayment)
class CustomerPaymentAdmin(admin.ModelAdmin):
    list_display = ('customer', 'payment_to', 'amount', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('customer__name',)


@admin.register(EmployeeAttendance)
class EmployeeAttendanceAdmin(admin.ModelAdmin):
     list_display = ('status',) 

@admin.register(PurchaseReturn)
class PurchaseReturnAdmin(admin.ModelAdmin):
    list_display = ('id', 'purchase', 'credit_account', 'refund_amount', 'timestamp')
    list_filter = ('timestamp',)

@admin.register(PurchaseReturnItem)
class PurchaseReturnItemAdmin(admin.ModelAdmin):
    list_display = ('purchase_return', 'product', 'quantity', 'purchase_cost')


@admin.register(OTAUpdateBundle)
class OTAUpdateBundleAdmin(admin.ModelAdmin):
    list_display = ('version', 'native_version_required', 'is_testing', 'is_active', 'is_mandatory', 'created_at')
    list_filter = ('is_testing', 'is_active', 'is_mandatory', 'created_at')
    search_fields = ('version', 'native_version_required')

@admin.register(MobileModel)
class MobileModelAdmin(admin.ModelAdmin):
    list_display = ('brand', 'model_name',)
    list_filter = ('brand',)
    search_fields = ('brand__name', 'model_name',)