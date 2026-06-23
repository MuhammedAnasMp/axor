from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Employee, Category, Brand, Product, Stock, StockHistory,
    Supplier, Customer, BankAccount, MoneyTransfer, Income,
    ExpenseCategory, Expense, Purchase, PurchaseItem, SupplierPayment,
    Sale, SaleItem, CustomerPayment, SupplierProduct, SupplierCostHistory,
    EmployeeSalaryPayment, EmployeeAdvance, EmployeeAttendance, EmployeePayrollAuditTrail,
    PurchaseReturn, PurchaseReturnItem, MobileModel
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    email = serializers.CharField(required=False, allow_blank=True, default='')
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, default='')
    outstanding_advance = serializers.SerializerMethodField(read_only=True)
    monthly_attendance = serializers.SerializerMethodField(read_only=True)
    total_salary_paid = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'user', 'role', 'phone', 'sales_performance', 'basic_salary', 'is_active', 
                  'username', 'password', 'email', 'first_name', 'last_name',
                  'outstanding_advance', 'monthly_attendance', 'total_salary_paid', 'image_url']
        read_only_fields = ['sales_performance']

    def get_outstanding_advance(self, obj):
        from django.db.models import Sum
        from .models import EmployeeAdvance
        return float(EmployeeAdvance.objects.filter(employee=obj, status='Pending').aggregate(total=Sum('amount'))['total'] or 0.00)

    def get_monthly_attendance(self, obj):
        import datetime
        import calendar
        from .models import EmployeeAttendance
        today = datetime.date.today()
        days_in_month = calendar.monthrange(today.year, today.month)[1]
        attendances = EmployeeAttendance.objects.filter(
            employee=obj,
            date__year=today.year,
            date__month=today.month
        )
        present_days = attendances.filter(status='Present').count()
        half_days = attendances.filter(status='Half Day').count()
        total_val = present_days + (half_days * 0.5)
        if isinstance(total_val, float) and total_val.is_integer():
            total_val = int(total_val)
        return f"{total_val}/{days_in_month}"

    def get_total_salary_paid(self, obj):
        from django.db.models import Sum
        from .models import EmployeeSalaryPayment
        return float(EmployeeSalaryPayment.objects.filter(employee=obj, status='Paid').aggregate(total=Sum('total_paid'))['total'] or 0.00)

    def validate_username(self, value):
        user_query = User.objects.filter(username__iexact=value)
        if self.instance and self.instance.user:
            user_query = user_query.exclude(pk=self.instance.user.pk)
        if user_query.exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def create(self, validated_data):
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        email = validated_data.pop('email', '')
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        
        if not username or not password:
            raise serializers.ValidationError({"detail": "Username and password are required for registration."})

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        
        employee = Employee.objects.create(user=user, **validated_data)
        return employee

    def update(self, instance, validated_data):
        user = instance.user
        email = validated_data.pop('email', None)
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)

        if email is not None:
            user.email = email
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if username is not None and username != user.username:
            from django.contrib.auth.models import User as DjangoUser
            if DjangoUser.objects.exclude(pk=user.pk).filter(username__iexact=username).exists():
                raise serializers.ValidationError({"username": "A user with that username already exists."})
            user.username = username
        if password:
            user.set_password(password)
        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['first_name'] = instance.user.first_name
        ret['last_name'] = instance.user.last_name
        ret['email'] = instance.user.email
        ret['username'] = instance.user.username
        return ret

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class MobileModelSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    
    class Meta:
        model = MobileModel
        fields = ['id', 'brand', 'brand_name', 'model_name']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    stock_qty = serializers.IntegerField(source='stock.quantity', read_only=True)
    profit_per_item = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    suitable_models_details = MobileModelSerializer(source='suitable_models', many=True, read_only=True)
    suitable_models = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=MobileModel.objects.all(),
        required=False
    )

    class Meta:
        model = Product
        fields = ['id', 'name', 'barcode', 'description', 'category', 'category_name', 
                  'brand', 'brand_name', 'selling_price', 'average_cost', 
                  'last_landed_cost', 'profit_per_item', 'status', 'image_url', 'stock_qty',
                  'suitable_models', 'suitable_models_details']

class StockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    barcode = serializers.CharField(source='product.barcode', read_only=True)
    suitable_models_details = MobileModelSerializer(source='product.suitable_models', many=True, read_only=True)

    class Meta:
        model = Stock
        fields = ['id', 'product', 'product_name', 'barcode', 'quantity', 'suitable_models_details']

class StockHistorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    suitable_models_details = MobileModelSerializer(source='product.suitable_models', many=True, read_only=True)

    class Meta:
        model = StockHistory
        fields = '__all__'

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class SupplierProductSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    barcode = serializers.CharField(source='product.barcode', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    category_id = serializers.IntegerField(source='product.category.id', read_only=True, allow_null=True)
    category_name = serializers.CharField(source='product.category.name', read_only=True, allow_null=True)
    product_image = serializers.CharField(source='product.image_url', read_only=True, allow_null=True)
    selling_price = serializers.DecimalField(source='product.selling_price', max_digits=12, decimal_places=2, read_only=True)
    suitable_models_details = MobileModelSerializer(source='product.suitable_models', many=True, read_only=True)

    class Meta:
        model = SupplierProduct
        fields = '__all__'

class SupplierCostHistorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    barcode = serializers.CharField(source='product.barcode', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    suitable_models_details = MobileModelSerializer(source='product.suitable_models', many=True, read_only=True)

    class Meta:
        model = SupplierCostHistory
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = '__all__'

class MoneyTransferSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source='source_account.name', read_only=True)
    dest_name = serializers.CharField(source='dest_account.name', read_only=True)

    class Meta:
        model = MoneyTransfer
        fields = '__all__'

class IncomeSerializer(serializers.ModelSerializer):
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = Income
        fields = '__all__'

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    payment_source_name = serializers.CharField(source='payment_source.name', read_only=True)
    purchase_invoice_number = serializers.SerializerMethodField(read_only=True)
    purchase_supplier_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'

    def get_purchase_invoice_number(self, obj):
        return obj.purchase.invoice_number if obj.purchase else None

    def get_purchase_supplier_name(self, obj):
        return obj.purchase.supplier.name if obj.purchase and obj.purchase.supplier else None

class PurchaseReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    barcode = serializers.CharField(source='product.barcode', read_only=True)
    suitable_models_details = MobileModelSerializer(source='product.suitable_models', many=True, read_only=True)

    class Meta:
        model = PurchaseReturnItem
        fields = '__all__'

class PurchaseReturnSerializer(serializers.ModelSerializer):
    items = PurchaseReturnItemSerializer(many=True, read_only=True)
    credit_account_name = serializers.CharField(source='credit_account.name', read_only=True)

    class Meta:
        model = PurchaseReturn
        fields = '__all__'

class PurchaseItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    barcode = serializers.CharField(source='product.barcode', read_only=True)
    selling_price = serializers.DecimalField(source='product.selling_price', max_digits=12, decimal_places=2, read_only=True)
    stock_qty = serializers.IntegerField(source='product.stock.quantity', read_only=True)
    suitable_models_details = MobileModelSerializer(source='product.suitable_models', many=True, read_only=True)

    class Meta:
        model = PurchaseItem
        fields = '__all__'

class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True, read_only=True)
    returns = PurchaseReturnSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    paid_from_name = serializers.CharField(source='paid_from.name', read_only=True)

    class Meta:
        model = Purchase
        fields = '__all__'

class SupplierPaymentSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    payment_from_name = serializers.CharField(source='payment_from.name', read_only=True)

    class Meta:
        model = SupplierPayment
        fields = '__all__'

class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    barcode = serializers.CharField(source='product.barcode', read_only=True)
    suitable_models_details = MobileModelSerializer(source='product.suitable_models', many=True, read_only=True)

    class Meta:
        model = SaleItem
        fields = '__all__'

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    paid_to_name = serializers.CharField(source='paid_to.name', read_only=True)

    class Meta:
        model = Sale
        fields = '__all__'

class CustomerPaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    payment_to_name = serializers.CharField(source='payment_to.name', read_only=True)

    class Meta:
        model = CustomerPayment
        fields = '__all__'

class EmployeeSalaryPaymentSerializer(serializers.ModelSerializer):
    employee_username = serializers.CharField(source='employee.user.username', read_only=True)
    paid_from_name = serializers.CharField(source='paid_from.name', read_only=True)

    class Meta:
        model = EmployeeSalaryPayment
        fields = '__all__'

class EmployeeAdvanceSerializer(serializers.ModelSerializer):
    employee_username = serializers.CharField(source='employee.user.username', read_only=True)
    paid_from_name = serializers.CharField(source='paid_from.name', read_only=True)

    class Meta:
        model = EmployeeAdvance
        fields = '__all__'

class EmployeeAttendanceSerializer(serializers.ModelSerializer):
    employee_username = serializers.CharField(source='employee.user.username', read_only=True)

    class Meta:
        model = EmployeeAttendance
        fields = '__all__'

class EmployeePayrollAuditTrailSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeePayrollAuditTrail
        fields = '__all__'
