from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
import hashlib
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal

class Employee(models.Model):
    ROLES = [
        ('Owner', 'Owner'),
        ('Manager', 'Manager'),
        ('Cashier', 'Cashier'),
        ('Store Keeper', 'Store Keeper'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee')
    role = models.CharField(max_length=50, choices=ROLES, default='Cashier')
    phone = models.CharField(max_length=20, blank=True)
    sales_performance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    barcode = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00) # Recommended Retail Price
    average_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00) # Weighted Average Cost (WAC)
    last_landed_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.BooleanField(default=True) # Active/Inactive
    image_url = models.URLField(max_length=500, blank=True, null=True)

    @property
    def profit_per_item(self):
        # Theoretical profit: Selling Price - average_cost
        return Decimal(str(self.selling_price or 0)) - Decimal(str(self.average_cost or 0))

    def __str__(self):
        return self.name

class Stock(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='stock')
    quantity = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.product.name} - {self.quantity}"

@receiver(post_save, sender=Product)
def create_product_stock(sender, instance, created, **kwargs):
    if created:
        Stock.objects.get_or_create(product=instance, defaults={'quantity': 0})

class StockHistory(models.Model):
    ACTIONS = [
        ('Add', 'Add Stock'),
        ('Remove', 'Remove Stock'),
        ('Transfer', 'Stock Transfer'),
        ('Adjustment', 'Stock Adjustment'),
        ('Damage', 'Damaged Items'),
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_history')
    quantity_changed = models.IntegerField()
    action_type = models.CharField(max_length=50, choices=ACTIONS)
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action_type} - {self.product.name} ({self.quantity_changed})"

class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_info = models.TextField(blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True, default='')
    contact_number = models.CharField(max_length=20, blank=True, default='')
    place = models.CharField(max_length=200, blank=True, default='')
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name

class SupplierProduct(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='product_mappings')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='supplier_mappings')
    current_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ('supplier', 'product')

    def __str__(self):
        return f"{self.supplier.name} - {self.product.name} (₹{self.current_cost})"

class SupplierCostHistory(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='cost_history')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cost_history')
    cost = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    purchase = models.ForeignKey('Purchase', on_delete=models.SET_NULL, null=True, blank=True, related_name='cost_history_entries')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.supplier.name} - {self.product.name} - cost: ₹{self.cost}, sell: ₹{self.selling_price} ({self.timestamp})"

class Customer(models.Model):
    name = models.CharField(max_length=200)
    contact_info = models.TextField(blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True, default='')
    contact_number = models.CharField(max_length=20, blank=True, default='')
    place = models.CharField(max_length=200, blank=True, default='')
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=10000.00)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name

class BankAccount(models.Model):
    name = models.CharField(max_length=100, unique=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.name} (₹{self.balance})"

class MoneyTransfer(models.Model):
    source_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='transfers_out')
    dest_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='transfers_in')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transfer ₹{self.amount} from {self.source_account.name} to {self.dest_account.name}"

class Income(models.Model):
    source = models.CharField(max_length=100) # e.g., Supplier Rebate, Interest, etc.
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='incomes')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='rebates')
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Income: ₹{self.amount} - {self.source}"

class ExpenseCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Expense(models.Model):
    category = models.ForeignKey(ExpenseCategory, on_delete=models.CASCADE, related_name='expenses')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_source = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='expenses')
    description = models.TextField(blank=True)
    receipt_url = models.URLField(max_length=500, blank=True, null=True)
    is_recurring = models.BooleanField(default=False)
    recurrence_schedule = models.CharField(max_length=50, blank=True) # e.g. Monthly, Weekly
    purchase = models.ForeignKey('Purchase', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Expense: ₹{self.amount} - {self.category.name}"

class Purchase(models.Model):
    PAYMENT_CHOICES = [
        ('Cash', 'Cash'),
        ('Bank', 'Bank'),
        ('Credit', 'Credit'),
    ]
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchases')
    invoice_number = models.CharField(max_length=100, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    additional_costs = models.DecimalField(max_digits=12, decimal_places=2, default=0.00) # Shipping, Customs, etc.
    rounding = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    paid_from = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True)
    is_received = models.BooleanField(default=False)
    deducted_credit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=50, default='Pending') # 'Pending', 'Received', 'Partially Returned', 'Returned'
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Purchase PO#{self.id} - {self.supplier.name}"

class PurchaseItem(models.Model):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='purchase_items')
    quantity = models.IntegerField()
    returned_qty = models.IntegerField(default=0)
    purchase_cost = models.DecimalField(max_digits=12, decimal_places=2) # cost per unit
    new_selling_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.product.name} ({self.quantity} @ ₹{self.purchase_cost})"

class PurchaseReturn(models.Model):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='returns')
    credit_account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True)
    adjustment = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Return for PO#{self.purchase.id} - {self.timestamp}"

class PurchaseReturnItem(models.Model):
    purchase_return = models.ForeignKey(PurchaseReturn, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    purchase_cost = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} ({self.quantity} @ ₹{self.purchase_cost})"

class SupplierPayment(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='payments')
    payment_from = models.ForeignKey(BankAccount, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment ₹{self.amount} to {self.supplier.name}"

class Sale(models.Model):
    PAYMENT_CHOICES = [
        ('Cash', 'Cash'),
        ('Bank', 'Bank'),
        ('Credit', 'Credit'),
    ]
    invoice_number = models.CharField(max_length=100, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    paid_to = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    profit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sale Invoice#{self.invoice_number} - ₹{self.total_amount}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sale_items')
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2) # Selling Price (overridden or default)
    cost_at_sale = models.DecimalField(max_digits=12, decimal_places=2, default=0.00) # WAC at time of sale

    def __str__(self):
        return f"{self.product.name} ({self.quantity} @ ₹{self.unit_price})"

class CustomerPayment(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    payment_to = models.ForeignKey(BankAccount, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment ₹{self.amount} from {self.customer.name}"

class EmployeeSalaryPayment(models.Model):
    STATUS_CHOICES = [
        ('Paid', 'Paid'),
        ('Reversed', 'Reversed'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salary_payments')
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    advance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_paid = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Paid')
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    expense = models.ForeignKey('Expense', blank=True, null=True, on_delete=models.SET_NULL, related_name='salary_payment')
    paid_from = models.ForeignKey('BankAccount', null=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"Salary Payment for {self.employee.user.username} - ₹{self.total_paid} ({self.status})"

class EmployeeAdvance(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Deducted', 'Deducted'),
        ('Reversed', 'Reversed'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='advances')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    expense = models.ForeignKey('Expense', blank=True, null=True, on_delete=models.SET_NULL, related_name='advance_payment')
    paid_from = models.ForeignKey('BankAccount', null=True, on_delete=models.SET_NULL)
    salary_payment = models.ForeignKey(EmployeeSalaryPayment, blank=True, null=True, on_delete=models.SET_NULL, related_name='deducted_advances')

    def __str__(self):
        return f"Advance for {self.employee.user.username} - ₹{self.amount} ({self.status})"

class EmployeeAttendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Half Day', 'Half Day'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Present')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('employee', 'date')

    def __str__(self):
        return f"{self.employee.user.username} - {self.date} - {self.status}"

class EmployeePayrollAuditTrail(models.Model):
    salary_payment = models.ForeignKey(EmployeeSalaryPayment, on_delete=models.CASCADE, related_name='audit_trail')
    action = models.CharField(max_length=50) # Processed, Edited, Reversed, Recalculated
    old_data = models.JSONField(blank=True, null=True)
    new_data = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"Audit Trail: {self.salary_payment.employee.user.username} - {self.action} at {self.timestamp}"


class OTAUpdateBundle(models.Model):
    version = models.CharField(
        max_length=32, 
        unique=True, 
        help_text="Web asset version (e.g., 1.0.1)"
    )
    native_version_required = models.CharField(
        max_length=32, 
        help_text="Minimum native APK version required to run this bundle (e.g., 1.0.0)"
    )
    zip_file = models.FileField(
        upload_to="ota_updates/",
        validators=[FileExtensionValidator(allowed_extensions=['zip'])],
        help_text="ZIP file containing Vite build assets (index.html, assets/, etc.)"
    )
    zip_data = models.BinaryField(
        null=True, 
        blank=True,
        help_text="Binary contents of the ZIP file stored in the database for Render persistent serving"
    )
    checksum = models.CharField(
        max_length=64, 
        blank=True, 
        editable=False,
        help_text="SHA-256 checksum generated automatically on save"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this update bundle is active and downloadable"
    )
    is_testing = models.BooleanField(
        default=True,
        help_text="If true, this update is only visible to registered test devices"
    )
    is_mandatory = models.BooleanField(
        default=False,
        help_text="Forces the client app to apply the update immediately without confirmation"
    )
    release_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.zip_file and not self.checksum:
            sha256 = hashlib.sha256()
            file_content = b''
            for chunk in self.zip_file.chunks():
                sha256.update(chunk)
                file_content += chunk
            self.checksum = sha256.hexdigest()
            self.zip_data = file_content
            
        super().save(*args, **kwargs)
        
        # Delete the physical file from local disk immediately since it is stored in database (zip_data)
        if self.zip_file:
            try:
                self.zip_file.delete(save=False)
            except Exception:
                pass
        
        # Keep only the latest 2 bundles (current one and the previous one)
        all_bundles = type(self).objects.order_by('-created_at')
        if all_bundles.count() > 2:
            bundles_to_delete = all_bundles[2:]
            for old_bundle in bundles_to_delete:
                old_bundle.delete()

    def __str__(self):
        return f"OTA Update v{self.version} (Native Req: >=v{self.native_version_required}, Testing: {self.is_testing})"

