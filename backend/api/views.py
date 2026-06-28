from django.http import request
from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Sum, F, Q
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.views import APIView
from decimal import Decimal
import datetime

from .models import (
    Employee, Category, Brand, Product, Stock, StockHistory,
    Supplier, Customer, BankAccount, MoneyTransfer, Income,
    ExpenseCategory, Expense, Purchase, PurchaseItem, SupplierPayment,
    Sale, SaleItem, CustomerPayment, SupplierProduct, SupplierCostHistory,
    EmployeeSalaryPayment, EmployeeAdvance, EmployeeAttendance, EmployeePayrollAuditTrail,
    PurchaseReturn, PurchaseReturnItem, MobileModel
)
from .serializers import (
    EmployeeSerializer, CategorySerializer, BrandSerializer, ProductSerializer,
    StockSerializer, StockHistorySerializer, SupplierSerializer, CustomerSerializer,
    BankAccountSerializer, MoneyTransferSerializer, IncomeSerializer,
    ExpenseCategorySerializer, ExpenseSerializer, PurchaseSerializer, PurchaseItemSerializer,
    SupplierPaymentSerializer, SaleSerializer, SaleItemSerializer, CustomerPaymentSerializer,
    UserSerializer, SupplierProductSerializer, SupplierCostHistorySerializer,
    EmployeeSalaryPaymentSerializer, EmployeeAdvanceSerializer, EmployeeAttendanceSerializer, EmployeePayrollAuditTrailSerializer,
    MobileModelSerializer
)

from rest_framework import filters
from rest_framework.pagination import PageNumberPagination

class OptionalPageNumberPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        if 'page' not in request.query_params:
            return None
        return super().paginate_queryset(queryset, request, view)

def get_date_range_for_period(period):
    today = datetime.date.today()
    start_date = None
    end_date = today
    
    if period.startswith('custom_'):
        parts = period.split('_')
        if len(parts) == 3:
            try:
                start_date = datetime.datetime.strptime(parts[1], '%Y-%m-%d').date()
                end_date = datetime.datetime.strptime(parts[2], '%Y-%m-%d').date()
                return start_date, end_date
            except ValueError:
                pass

    if period == 'today':
        start_date = today
    elif period == 'yesterday':
        start_date = today - datetime.timedelta(days=1)
        end_date = start_date
    elif period == 'this_week':
        start_date = today - datetime.timedelta(days=today.weekday())
    elif period == 'this_month':
        start_date = today.replace(day=1)
    elif period == 'last_30_days':
        start_date = today - datetime.timedelta(days=30)
    elif period == 'all':
        start_date = None
        end_date = None
    else:
        start_date = today
        
    return start_date, end_date

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            employee = serializer.save()
            return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            try:
                employee = user.employee
                emp_data = EmployeeSerializer(employee).data
            except Employee.DoesNotExist:
                emp_data = {"user": UserSerializer(user).data, "role": "Owner"}
            return Response({"message": "Login successful", "user": emp_data})
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        logout(request)
        return Response({"message": "Logout successful"})

    @action(detail=False, methods=['get'])
    def me(self, request):

        print("Method:", request.method)
        print("Path:", request.path)
        print("GET params:", request.GET)
        print("POST data:", request.POST)
        print("Headers:", request.headers)
        print("Cookies:", request.COOKIES)
        print("User:", request.user)
        print("Body:", request.body)
        if request.user.is_authenticated:
            try:
                employee = request.user.employee
                emp_data = EmployeeSerializer(employee).data
            except Employee.DoesNotExist:
                emp_data = {"user": UserSerializer(request.user).data, "role": "Owner"}
            return Response(emp_data)
        return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'phone', 'role']
    ordering_fields = ['id', 'user__username', 'role', 'sales_performance', 'is_active']

    @action(detail=True, methods=['get'])
    def payroll_summary(self, request, pk=None):
        employee = self.get_object()
        outstanding_advance = EmployeeAdvance.objects.filter(employee=employee, status='Pending').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        total_salary_paid = EmployeeSalaryPayment.objects.filter(employee=employee, status='Paid').aggregate(total=Sum('total_paid'))['total'] or Decimal('0.00')
        
        payroll_qs = employee.salary_payments.all().order_by('-timestamp')
        advance_qs = employee.advances.all().order_by('-timestamp')
        attendance_qs = employee.attendances.all().order_by('-date')
        
        period = request.query_params.get('period')
        if period:
            start_date, end_date = get_date_range_for_period(period)
            if start_date:
                payroll_qs = payroll_qs.filter(timestamp__date__gte=start_date)
                advance_qs = advance_qs.filter(timestamp__date__gte=start_date)
                attendance_qs = attendance_qs.filter(date__gte=start_date)
            if end_date:
                payroll_qs = payroll_qs.filter(timestamp__date__lte=end_date)
                advance_qs = advance_qs.filter(timestamp__date__lte=end_date)
                attendance_qs = attendance_qs.filter(date__lte=end_date)
                
        payroll_history = EmployeeSalaryPaymentSerializer(payroll_qs, many=True).data
        advance_history = EmployeeAdvanceSerializer(advance_qs, many=True).data
        attendance_records = EmployeeAttendanceSerializer(attendance_qs, many=True).data

        return Response({
            "outstanding_advance_balance": float(outstanding_advance),
            "total_salary_paid": float(total_salary_paid),
            "pending_deductions": float(outstanding_advance),
            "payroll_history": payroll_history,
            "advance_history": advance_history,
            "attendance_records": attendance_records
        })

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['id', 'name']

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all().order_by('name')
    serializer_class = BrandSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['id', 'name']

class MobileModelViewSet(viewsets.ModelViewSet):
    queryset = MobileModel.objects.all().select_related('brand').order_by('brand__name', 'model_name')
    serializer_class = MobileModelSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['model_name', 'brand__name']
    ordering_fields = ['id', 'brand__name', 'model_name']

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'barcode', 'description', 'category__name', 'brand__name', 'suitable_models__model_name', 'suitable_models__brand__name']
    ordering_fields = ['id', 'name', 'selling_price', 'average_cost', 'status']

    def get_queryset(self):
        queryset = Product.objects.all().order_by('name')
        supplier_id = self.request.query_params.get('supplier_id')
        if supplier_id:
            queryset = queryset.filter(supplier_mappings__supplier_id=supplier_id)
        return queryset

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__barcode', 'product__suitable_models__model_name', 'product__suitable_models__brand__name']
    ordering_fields = ['id', 'product__name', 'quantity']

    @action(detail=False, methods=['post'])
    def transfer(self, request):
        product_id = request.data.get('product_id')
        qty = int(request.data.get('quantity', 0))
        from_desc = request.data.get('from_desc', 'Source Location')
        to_desc = request.data.get('to_desc', 'Destination Location')

        if qty <= 0:
            return Response({"error": "Quantity must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                product = Product.objects.get(pk=product_id)
                stock = product.stock
                if stock.quantity < qty:
                    return Response({"error": "Insufficient stock available"}, status=status.HTTP_400_BAD_REQUEST)

                stock.quantity -= qty
                stock.save()

                # Log decrement
                StockHistory.objects.create(
                    product=product,
                    quantity_changed=-qty,
                    action_type='Transfer',
                    description=f"Transferred OUT from {from_desc} to {to_desc}",
                    average_cost=product.average_cost
                )

                # Log increment (simulate receiving end or log destination)
                StockHistory.objects.create(
                    product=product,
                    quantity_changed=qty,
                    action_type='Transfer',
                    description=f"Transferred IN to {to_desc} from {from_desc}",
                    average_cost=product.average_cost
                )

                # Re-add to stock (net is same for simple single-depot representation, or represents relocation)
                stock.quantity += qty
                stock.save()

                return Response({"message": "Transfer logged successfully", "stock": StockSerializer(stock).data})
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def adjust(self, request):
        product_id = request.data.get('product_id')
        physical_qty = int(request.data.get('quantity', 0))
        reason = request.data.get('description', 'Physical Stock Count')

        try:
            with transaction.atomic():
                product = Product.objects.get(pk=product_id)
                stock = product.stock
                difference = physical_qty - stock.quantity

                stock.quantity = physical_qty
                stock.save()

                StockHistory.objects.create(
                    product=product,
                    quantity_changed=difference,
                    action_type='Adjustment',
                    description=f"Adjustment: {reason}. Stock count changed by {difference}",
                    average_cost=product.average_cost
                )

                return Response({"message": "Adjustment saved successfully", "stock": StockSerializer(stock).data})
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def damage(self, request):
        product_id = request.data.get('product_id')
        qty = int(request.data.get('quantity', 0))
        reason = request.data.get('description', 'Damaged during operation')
        bank_account_id = request.data.get('bank_account_id')

        if qty <= 0:
            return Response({"error": "Quantity must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                product = Product.objects.get(pk=product_id)
                stock = product.stock
                if stock.quantity < qty:
                    return Response({"error": "Insufficient stock to mark as damaged"}, status=status.HTTP_400_BAD_REQUEST)

                stock.quantity -= qty
                stock.save()

                StockHistory.objects.create(
                    product=product,
                    quantity_changed=-qty,
                    action_type='Damage',
                    description=f"Damaged items: {reason}",
                    average_cost=product.average_cost
                )

                # Calculate damage cost (qty * WAC average_cost)
                damage_cost = Decimal(qty) * product.average_cost

                # Automatically create an Expense
                damage_cat, _ = ExpenseCategory.objects.get_or_create(name="Damaged Goods")
                
                # Default to a cash/bank account if none provided
                if not bank_account_id:
                    account = BankAccount.objects.first()
                else:
                    account = BankAccount.objects.get(pk=bank_account_id)

                if account:
                    account.balance -= damage_cost
                    account.save()
                    
                    Expense.objects.create(
                        category=damage_cat,
                        amount=damage_cost,
                        payment_source=account,
                        description=f"Damaged items auto-expense: {qty}x {product.name} ({reason})"
                    )

                return Response({
                    "message": "Damaged items recorded and expense created",
                    "stock": StockSerializer(stock).data,
                    "expense_cost": float(damage_cost)
                })
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        except BankAccount.DoesNotExist:
            return Response({"error": "Bank account not found"}, status=status.HTTP_400_BAD_REQUEST)

class StockHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockHistorySerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__suitable_models__model_name', 'product__suitable_models__brand__name', 'action_type', 'description']
    ordering_fields = ['id', 'product__name', 'quantity_changed', 'action_type', 'timestamp']

    def get_queryset(self):
        queryset = StockHistory.objects.all().order_by('-timestamp')
        action_type = self.request.query_params.get('action_type')
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        period = self.request.query_params.get('period')
        if period:
            start_date, end_date = get_date_range_for_period(period)
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
        return queryset

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_info', 'whatsapp_number', 'contact_number', 'place']
    ordering_fields = ['id', 'name', 'outstanding_balance', 'place']

    @action(detail=True, methods=['post'])
    def receive_payment(self, request, pk=None):
        supplier = self.get_object()
        amount = Decimal(request.data.get('amount', 0))
        account_id = request.data.get('account_id')
        description = request.data.get('description', f"Refund/payment from {supplier.name}")

        if amount <= 0:
            return Response({"error": "Amount must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)

        if not account_id:
            return Response({"error": "Account is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                account = BankAccount.objects.get(pk=account_id)
                
                # Update supplier balance (outstanding balance goes up/towards zero because it was negative)
                supplier.outstanding_balance += amount
                supplier.save()

                # Update bank balance (we received money, so bank balance increases)
                account.balance += amount
                account.save()

                # Also create an Income entry to log this in the general ledger
                Income.objects.create(
                    source=f"Supplier Refund: {supplier.name}",
                    amount=amount,
                    payment_method=account,
                    supplier=supplier,
                    description=description
                )

                return Response({
                    "message": "Payment received from supplier successfully",
                    "outstanding_balance": supplier.outstanding_balance,
                    "account_balance": account.balance
                })
        except BankAccount.DoesNotExist:
            return Response({"error": "Bank account not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('name')
    serializer_class = CustomerSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_info', 'whatsapp_number', 'contact_number', 'place']
    ordering_fields = ['id', 'name', 'outstanding_balance', 'credit_limit', 'place']

class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['id', 'name', 'balance']

    @action(detail=False, methods=['post'])
    def transfer(self, request):
        src_id = request.data.get('source_account_id')
        dest_id = request.data.get('dest_account_id')
        amount = Decimal(request.data.get('amount', 0))

        if amount <= 0:
            return Response({"error": "Amount must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)

        if src_id == dest_id:
            return Response({"error": "Source and destination accounts must be different"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                src_acc = BankAccount.objects.get(pk=src_id)
                dest_acc = BankAccount.objects.get(pk=dest_id)

                if src_acc.balance < amount:
                    return Response({"error": "Insufficient funds in source account"}, status=status.HTTP_400_BAD_REQUEST)

                src_acc.balance -= amount
                dest_acc.balance += amount
                src_acc.save()
                dest_acc.save()

                MoneyTransfer.objects.create(
                    source_account=src_acc,
                    dest_account=dest_acc,
                    amount=amount
                )

                return Response({"message": "Transfer successful"})
        except BankAccount.DoesNotExist:
            return Response({"error": "One of the accounts does not exist"}, status=status.HTTP_404_NOT_FOUND)

class MoneyTransferViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MoneyTransferSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['source_account__name', 'dest_account__name', 'amount']
    ordering_fields = ['id', 'timestamp', 'amount']

    def get_queryset(self):
        queryset = MoneyTransfer.objects.all().order_by('-timestamp')
        period = self.request.query_params.get('period')
        if period:
            start_date, end_date = get_date_range_for_period(period)
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
        return queryset

class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['source', 'payment_method__name', 'supplier__name', 'description']
    ordering_fields = ['id', 'timestamp', 'amount']

    def get_queryset(self):
        queryset = Income.objects.all().order_by('-timestamp')
        period = self.request.query_params.get('period')
        if period:
            start_date, end_date = get_date_range_for_period(period)
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
        return queryset

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            income = serializer.save()

            # Increase chosen Bank/Cash balance
            account = income.payment_method
            account.balance += income.amount
            account.save()

            # If supplier rebate, decrease supplier's outstanding balance
            if income.supplier and "rebate" in income.source.lower():
                supplier = income.supplier
                supplier.outstanding_balance -= income.amount
                supplier.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all().order_by('name')
    serializer_class = ExpenseCategorySerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['id', 'name']

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['category__name', 'payment_source__name', 'description']
    ordering_fields = ['id', 'timestamp', 'amount']

    def get_queryset(self):
        queryset = Expense.objects.all().order_by('-timestamp')
        period = self.request.query_params.get('period')
        if period:
            start_date, end_date = get_date_range_for_period(period)
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
        return queryset

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            expense = serializer.save()

            # Decrease selected cash/bank balance
            account = expense.payment_source
            account.balance -= expense.amount
            account.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

class PurchaseViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['supplier__name', 'invoice_number', 'payment_type']
    ordering_fields = ['id', 'timestamp', 'total_amount', 'is_received']

    def get_queryset(self):
        queryset = Purchase.objects.all().order_by('-timestamp')
        is_received = self.request.query_params.get('is_received')
        if is_received is not None:
            queryset = queryset.filter(is_received=is_received.lower() == 'true')
        period = self.request.query_params.get('period')
        if period:
            start_date, end_date = get_date_range_for_period(period)
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data
        items_data = data.get('items', [])
        supplier_id = data.get('supplier')
        
        if not items_data:
            return Response({"error": "Purchase order must contain at least one item"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate that each product is supplied by the selected supplier
        for item in items_data:
            product_id = item.get('product')
            try:
                prod = Product.objects.get(pk=product_id)
                if not SupplierProduct.objects.filter(supplier_id=supplier_id, product_id=product_id).exists():
                    return Response(
                        {"error": f"Product '{prod.name}' (ID: {product_id}) is not supplied by the selected supplier. Please map it first in Product Management."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Product.DoesNotExist:
                return Response({"error": f"Product with ID {product_id} does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        payment_type = data.get('payment_type')
        paid_from_id = data.get('paid_from')
        if payment_type != 'Credit' and paid_from_id:
            try:
                account = BankAccount.objects.get(pk=paid_from_id)
                total_amount = Decimal(data.get('total_amount', 0))
                if account.balance < total_amount:
                    return Response(
                        {"error": f"Insufficient funds in account '{account.name}' (Current Balance: ₹{account.balance}, Required: ₹{total_amount})"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except BankAccount.DoesNotExist:
                return Response({"error": "Selected bank account does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                total_amount_val = data.get('total_amount')
                additional_costs_val = data.get('additional_costs')
                deducted_credit_val = data.get('deducted_credit')

                purchase = Purchase.objects.create(
                    supplier_id=supplier_id,
                    invoice_number=data.get('invoice_number', ''),
                    total_amount=Decimal(str(total_amount_val)) if total_amount_val is not None else Decimal('0.00'),
                    additional_costs=Decimal(str(additional_costs_val)) if additional_costs_val is not None else Decimal('0.00'),
                    payment_type=data.get('payment_type'),
                    paid_from_id=data.get('paid_from') if data.get('paid_from') else None,
                    deducted_credit=Decimal(str(deducted_credit_val)) if deducted_credit_val is not None else Decimal('0.00'),
                    is_received=False
                )

                for item in items_data:
                    cost_val = item.get('purchase_cost')
                    new_sell_val = item.get('new_selling_price')
                    PurchaseItem.objects.create(
                        purchase=purchase,
                        product_id=item.get('product'),
                        quantity=int(item.get('quantity')),
                        purchase_cost=Decimal(str(cost_val)) if cost_val is not None else Decimal('0.00'),
                        new_selling_price=Decimal(str(new_sell_val)) if new_sell_val is not None and str(new_sell_val).strip() != '' and str(new_sell_val) != 'None' else None
                    )

                serializer = PurchaseSerializer(purchase)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        try:
            with transaction.atomic():
                purchase = Purchase.objects.get(pk=pk)
                if purchase.is_received:
                    return Response({"error": "Purchase order has already been received"}, status=status.HTTP_400_BAD_REQUEST)

                data = request.data

                # If items are passed, replace PO items
                if 'items' in data:
                    items_data = data.get('items', [])
                    if not items_data:
                        return Response({"error": "Purchase order must contain at least one item"}, status=status.HTTP_400_BAD_REQUEST)

                    # Validate supplier product mapping
                    for item in items_data:
                        product_id = item.get('product')
                        try:
                            prod = Product.objects.get(pk=product_id)
                            if not SupplierProduct.objects.filter(supplier_id=purchase.supplier_id, product_id=product_id).exists():
                                return Response(
                                    {"error": f"Product '{prod.name}' (ID: {product_id}) is not supplied by the selected supplier. Please map it first in Product Management."},
                                    status=status.HTTP_400_BAD_REQUEST
                                )
                        except Product.DoesNotExist:
                            return Response({"error": f"Product with ID {product_id} does not exist."}, status=status.HTTP_400_BAD_REQUEST)

                    # Delete old items and recreate
                    purchase.items.all().delete()
                    for item in items_data:
                        PurchaseItem.objects.create(
                            purchase=purchase,
                            product_id=item.get('product'),
                            quantity=int(item.get('quantity')),
                            purchase_cost=Decimal(str(item.get('purchase_cost'))),
                            new_selling_price=Decimal(str(item.get('new_selling_price'))) if item.get('new_selling_price') is not None and str(item.get('new_selling_price')).strip() != '' else None
                        )

                # Update additional costs if passed
                if 'additional_costs' in data:
                    val = data.get('additional_costs')
                    purchase.additional_costs = Decimal(str(val)) if val is not None else Decimal('0.00')

                if 'rounding' in data:
                    val = data.get('rounding')
                    purchase.rounding = Decimal(str(val)) if val is not None else Decimal('0.00')

                # Update total amount if passed
                if 'total_amount' in data:
                    val = data.get('total_amount')
                    purchase.total_amount = Decimal(str(val)) if val is not None else Decimal('0.00')

                # Update payment type & paid from if passed
                if 'payment_type' in data:
                    purchase.payment_type = data.get('payment_type')
                if 'paid_from' in data:
                    purchase.paid_from_id = data.get('paid_from') if data.get('paid_from') else None
                if 'deducted_credit' in data:
                    val = data.get('deducted_credit')
                    purchase.deducted_credit = Decimal(str(val)) if val is not None else Decimal('0.00')

                purchase.is_received = True
                purchase.status = 'Received'
                purchase.save()

                items = purchase.items.all()
                total_items_cost = sum(item.quantity * item.purchase_cost for item in items)
                additional_costs = purchase.additional_costs
                rounding = purchase.rounding

                for item in items:
                    product = item.product
                    stock = product.stock

                    # Pro-rate additional costs based on share of total purchase cost
                    if total_items_cost > 0:
                        item_share_fraction = (item.quantity * item.purchase_cost) / total_items_cost
                        item_additional_cost_share = item_share_fraction * additional_costs
                    else:
                        item_additional_cost_share = Decimal(0)

                    unit_additional_cost = item_additional_cost_share / item.quantity
                    landed_unit_cost = item.purchase_cost + unit_additional_cost

                    # 1. Update last landed cost
                    product.last_landed_cost = landed_unit_cost

                    # 2. Recalculate average_cost (WAC)
                    current_qty = stock.quantity
                    existing_wac = product.average_cost
                    new_qty = item.quantity

                    if (current_qty + new_qty) > 0:
                        recalculated_wac = ((Decimal(current_qty) * existing_wac) + (Decimal(new_qty) * landed_unit_cost)) / Decimal(current_qty + new_qty)
                    else:
                        recalculated_wac = landed_unit_cost

                    product.average_cost = recalculated_wac
                    
                    # Write to SupplierCostHistory and update SupplierProduct mapping
                    new_sell = item.new_selling_price if item.new_selling_price is not None else product.selling_price
                    SupplierCostHistory.objects.create(
                        supplier=purchase.supplier,
                        product=product,
                        cost=item.purchase_cost,
                        selling_price=new_sell,
                        purchase=purchase
                    )
                    
                    supplier_product, _ = SupplierProduct.objects.get_or_create(
                        supplier=purchase.supplier,
                        product=product
                    )
                    supplier_product.current_cost = item.purchase_cost
                    supplier_product.save()

                    # 3. Update default selling price if requested
                    if item.new_selling_price is not None:
                        product.selling_price = item.new_selling_price

                    product.save()

                    # 4. Increment stock quantity
                    stock.quantity += new_qty
                    stock.save()

                    # 5. Log Stock History
                    StockHistory.objects.create(
                        product=product,
                        quantity_changed=new_qty,
                        action_type='Add',
                        description=f"Received via Purchase PO#{purchase.id}",
                        average_cost=product.average_cost
                    )

                # 6. Financial Settlement
                # Portion paid/credited to the supplier is total_items_cost minus rounding (discount)
                # Landing costs are self expenses paid from paid_from
                supplier_portion = total_items_cost - rounding
                self_expense_amount = additional_costs

                # If payment type is Cash/Bank, paid_from is required
                if purchase.payment_type != 'Credit':
                    if not purchase.paid_from_id:
                        raise Exception("A bank account (paid_from) is required to cover supplier payments.")

                # If paid_from is specified, check balance and deduct
                if purchase.paid_from_id:
                    account = BankAccount.objects.get(pk=purchase.paid_from_id)
                    paid_old_credit_input = data.get('paid_old_credit')
                    if paid_old_credit_input is not None:
                        paid_old_credit = Decimal(str(paid_old_credit_input))
                    else:
                        paid_old_credit = Decimal('0')

                    if purchase.payment_type != 'Credit':
                        effective_deduct = min(purchase.deducted_credit, supplier_portion)
                        actual_supplier_payment = max(Decimal('0'), supplier_portion - effective_deduct)
                        total_required = actual_supplier_payment + paid_old_credit + self_expense_amount
                    else:
                        total_required = self_expense_amount

                    if account.balance < total_required:
                        raise Exception(f"Insufficient funds in account '{account.name}' (Current Balance: ₹{account.balance}, Required: ₹{total_required})")

                    # Deduct from account
                    if purchase.payment_type != 'Credit':
                        effective_deduct = min(purchase.deducted_credit, supplier_portion)
                        actual_supplier_payment = max(Decimal('0'), supplier_portion - effective_deduct)
                        account.balance -= (actual_supplier_payment + paid_old_credit + self_expense_amount)
                    else:
                        account.balance -= self_expense_amount
                    account.save()

                    # Deduct paid old credit from supplier balance
                    if purchase.payment_type != 'Credit' and paid_old_credit > Decimal('0'):
                        supplier = purchase.supplier
                        supplier.outstanding_balance -= paid_old_credit
                        supplier.save()
                else:
                    paid_old_credit = Decimal('0')

                # Adjust supplier's outstanding balance by the deducted credit (bringing negative balance towards 0, capped at supplier_portion)
                if purchase.deducted_credit > Decimal('0'):
                    effective_deduct = min(purchase.deducted_credit, supplier_portion)
                    supplier = purchase.supplier
                    supplier.outstanding_balance += effective_deduct
                    supplier.save()

                # For Credit PO, increase supplier's outstanding balance only by the remaining portion
                if purchase.payment_type == 'Credit':
                    effective_deduct = min(purchase.deducted_credit, supplier_portion)
                    supplier = purchase.supplier
                    supplier.outstanding_balance += (supplier_portion - effective_deduct)
                    supplier.save()

                # 7. Create Expense entries for self expenses
                if purchase.paid_from_id:
                    if additional_costs > 0:
                        landed_cat, _ = ExpenseCategory.objects.get_or_create(name="Landed Costs")
                        Expense.objects.create(
                            category=landed_cat,
                            amount=additional_costs,
                            payment_source_id=purchase.paid_from_id,
                            description=f"Additional expance (Shipping, Customs, Delivery) for Purchase PO#{purchase.id}",
                            purchase=purchase
                        )

                    if rounding != 0:
                        adj_cat, _ = ExpenseCategory.objects.get_or_create(name="Settlement Adjustments")
                        Expense.objects.create(
                            category=adj_cat,
                            amount=-rounding,
                            payment_source_id=purchase.paid_from_id,
                            description=f"Rounding/Adjustment (Discount) for Purchase PO#{purchase.id}",
                            purchase=purchase
                        )

                return Response({"message": "Purchase received successfully. Stock and financials updated."})
        except Purchase.DoesNotExist:
            return Response({"error": "Purchase order not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def return_purchase(self, request, pk=None):
        # Return products back to supplier
        try:
            with transaction.atomic():
                purchase = Purchase.objects.get(pk=pk)
                if not purchase.is_received:
                    return Response({"error": "Cannot return items for an unreceived Purchase Order"}, status=status.HTTP_400_BAD_REQUEST)

                return_items_data = request.data.get('items')
                adjustment_val = request.data.get('adjustment', 0)
                try:
                    adjustment = Decimal(str(adjustment_val)) if adjustment_val is not None else Decimal('0.00')
                except Exception:
                    adjustment = Decimal('0.00')

                credit_account_id = request.data.get('credit_account')
                if not credit_account_id:
                    return Response({"error": "A credit account must be selected for the return."}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    credit_account = BankAccount.objects.get(pk=credit_account_id)
                except BankAccount.DoesNotExist:
                    return Response({"error": "Selected credit account does not exist."}, status=status.HTTP_400_BAD_REQUEST)

                purchase_items = {item.product_id: item for item in purchase.items.all()}

                if return_items_data is None:
                    # Default: return all remaining items
                    return_items = []
                    for item in purchase.items.all():
                        remaining = item.quantity - item.returned_qty
                        if remaining > 0:
                            return_items.append({'product_id': item.product_id, 'quantity': remaining, 'return_cost': item.purchase_cost})
                else:
                    return_items = []
                    for item_data in return_items_data:
                        product_id = int(item_data.get('product'))
                        qty_to_return = int(item_data.get('quantity', 0))
                        if qty_to_return <= 0:
                            continue
                        
                        if product_id not in purchase_items:
                            return Response({"error": f"Product with ID {product_id} is not part of this Purchase Order"}, status=status.HTTP_400_BAD_REQUEST)
                        
                        po_item = purchase_items[product_id]
                        remaining_qty = po_item.quantity - po_item.returned_qty
                        if qty_to_return > remaining_qty:
                            return Response({"error": f"Cannot return more than remaining quantity ({remaining_qty}) for product {po_item.product.name}"}, status=status.HTTP_400_BAD_REQUEST)
                        
                        custom_cost_val = item_data.get('purchase_cost')
                        if custom_cost_val is not None:
                            return_cost = Decimal(str(custom_cost_val))
                        else:
                            return_cost = po_item.purchase_cost

                        return_items.append({'product_id': product_id, 'quantity': qty_to_return, 'return_cost': return_cost})

                if not return_items:
                    return Response({"error": "No items specified for return"}, status=status.HTTP_400_BAD_REQUEST)

                # Validate stock for all return items first
                for item in return_items:
                    prod_id = item['product_id']
                    qty = item['quantity']
                    po_item = purchase_items[prod_id]
                    product = po_item.product
                    if product.stock.quantity < qty:
                        return Response({"error": f"Insufficient stock for {product.name} (Stock: {product.stock.quantity}, Return request: {qty}) to complete return"}, status=status.HTTP_400_BAD_REQUEST)

                # Process returns
                total_refund = Decimal('0.00')
                return_records = []
                for item in return_items:
                    prod_id = item['product_id']
                    qty = item['quantity']
                    return_cost = item['return_cost']
                    po_item = purchase_items[prod_id]
                    product = po_item.product
                    
                    # Decrement stock
                    stock = product.stock
                    stock.quantity -= qty
                    stock.save()

                    # Log stock history
                    StockHistory.objects.create(
                        product=product,
                        quantity_changed=-qty,
                        action_type='Remove',
                        description=f"Returned to Supplier ({qty} units @ ₹{return_cost}) from Purchase PO#{purchase.id}",
                        average_cost=product.average_cost
                    )

                    # Update the PurchaseItem returned_qty
                    po_item.returned_qty += qty
                    po_item.save()

                    # Calculate refund value
                    total_refund += Decimal(str(qty)) * return_cost
                    return_records.append((product, qty, return_cost))

                # Calculate final refund amount
                refund_amount = total_refund - adjustment

                # Create Return Logs
                purchase_return = PurchaseReturn.objects.create(
                    purchase=purchase,
                    credit_account=credit_account,
                    adjustment=adjustment,
                    refund_amount=refund_amount
                )

                for prod, qty, cost in return_records:
                    PurchaseReturnItem.objects.create(
                        purchase_return=purchase_return,
                        product=prod,
                        quantity=qty,
                        purchase_cost=cost
                    )

                # Check if this is a full return
                is_full_return = True
                for item in purchase.items.all():
                    if item.returned_qty < item.quantity:
                        is_full_return = False
                        break

                if is_full_return:
                    purchase.status = 'Returned'
                else:
                    purchase.status = 'Partially Returned'

                purchase.total_amount -= refund_amount
                purchase.save()

                # Credit selected bank account
                credit_account.balance += refund_amount
                credit_account.save()

                msg = f"Returned items successfully. PO status updated to '{purchase.status}'. Refund amount: ₹{refund_amount:.2f} credited to {credit_account.name}."

                return Response({"message": msg})
        except Purchase.DoesNotExist:
            return Response({"error": "Purchase order not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SupplierPaymentViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierPaymentSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['supplier__name', 'payment_from__name']
    ordering_fields = ['id', 'timestamp', 'amount']

    def get_queryset(self):
        queryset = SupplierPayment.objects.all().order_by('-timestamp')
        period = self.request.query_params.get('period')
        if period:
            start_date, end_date = get_date_range_for_period(period)
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                payment = serializer.save()

                # Decrease supplier outstanding balance
                supplier = payment.supplier
                supplier.outstanding_balance -= payment.amount
                supplier.save()

                # Decrease selected bank balance
                account = payment.payment_from
                account.balance -= payment.amount
                account.save()

                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SupplierProductViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierProductSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__barcode', 'product__suitable_models__model_name', 'product__suitable_models__brand__name', 'supplier__name']
    ordering_fields = ['id', 'current_cost']

    def get_queryset(self):
        queryset = SupplierProduct.objects.all().order_by('product__name')
        supplier_id = self.request.query_params.get('supplier_id')
        product_id = self.request.query_params.get('product_id')
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

class SupplierCostHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SupplierCostHistorySerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__barcode', 'product__suitable_models__model_name', 'product__suitable_models__brand__name', 'supplier__name']
    ordering_fields = ['id', 'cost', 'timestamp']

    def get_queryset(self):
        queryset = SupplierCostHistory.objects.all().order_by('-timestamp')
        supplier_id = self.request.query_params.get('supplier_id')
        product_id = self.request.query_params.get('product_id')
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        period = self.request.query_params.get('period')
        if period:
            start_date, end_date = get_date_range_for_period(period)
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
        return queryset

class SaleViewSet(viewsets.ModelViewSet):
    serializer_class = SaleSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'customer__name', 'employee__user__username', 'payment_type']
    ordering_fields = ['id', 'timestamp', 'total_amount', 'profit']

    def get_queryset(self):
        queryset = Sale.objects.all().order_by('-timestamp')
        period = self.request.query_params.get('period')
        if period:
            start_date, end_date = get_date_range_for_period(period)
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data
        items_data = data.get('items', [])
        payment_type = data.get('payment_type')
        customer_id = data.get('customer')
        employee_id = data.get('employee')
        total_amount = Decimal(data.get('total_amount', 0))
        discount = Decimal(data.get('discount', 0))
        tax = Decimal(data.get('tax', 0))

        if not items_data:
            return Response({"error": "Sales invoice must contain at least one item"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Customer check
                customer = None
                if customer_id:
                    customer = Customer.objects.get(pk=customer_id)
                    if payment_type == 'Credit':
                        # Verify credit limit
                        available_credit = customer.credit_limit - customer.outstanding_balance
                        if total_amount > available_credit:
                            return Response({"error": f"Credit limit exceeded. Available: ₹{available_credit}"}, status=status.HTTP_400_BAD_REQUEST)

                # Retrieve cashier/employee
                employee = None
                if employee_id:
                    try:
                        employee = Employee.objects.get(pk=employee_id)
                    except Employee.DoesNotExist:
                        pass

                # Check and reserve stock
                temp_items = []
                for item in items_data:
                    prod = Product.objects.get(pk=item.get('product'))
                    qty = int(item.get('quantity'))
                    if prod.stock.quantity < qty:
                        return Response({"error": f"Insufficient stock for product '{prod.name}'"}, status=status.HTTP_400_BAD_REQUEST)
                    temp_items.append((prod, qty, Decimal(item.get('unit_price'))))

                # Generate invoice number if not provided
                invoice_number = data.get('invoice_number')
                if not invoice_number:
                    invoice_number = f"INV-{timezone.now().strftime('%Y%m%d%H%M%S')}"

                sale = Sale.objects.create(
                    invoice_number=invoice_number,
                    customer=customer,
                    employee=employee,
                    payment_type=payment_type,
                    paid_to_id=data.get('paid_to') if data.get('paid_to') else None,
                    total_amount=total_amount,
                    discount=discount,
                    tax=tax,
                    profit=0 # calculated below
                )

                total_profit = Decimal(0)
                for prod, qty, unit_price in temp_items:
                    # Calculate profit using: Actual Selling Price - WAC cost
                    cost_at_sale = prod.average_cost
                    item_profit = (unit_price - cost_at_sale) * Decimal(qty)
                    total_profit += item_profit

                    SaleItem.objects.create(
                        sale=sale,
                        product=prod,
                        quantity=qty,
                        unit_price=unit_price,
                        cost_at_sale=cost_at_sale
                    )

                    # Decrement Stock
                    stock = prod.stock
                    stock.quantity -= qty
                    stock.save()

                    # Log Stock History
                    StockHistory.objects.create(
                        product=prod,
                        quantity_changed=-qty,
                        action_type='Remove',
                        description=f"Sold via Invoice#{invoice_number}",
                        average_cost=prod.average_cost
                    )

                # Set profit on sale
                sale.profit = total_profit
                sale.save()

                # Financial updates
                if payment_type == 'Credit' and customer:
                    customer.outstanding_balance += total_amount
                    customer.save()
                else:
                    paid_to_id = data.get('paid_to')
                    if paid_to_id:
                        account = BankAccount.objects.get(pk=paid_to_id)
                    else:
                        account = BankAccount.objects.first()
                    
                    if account:
                        account.balance += total_amount
                        account.save()
                        # Update sale record with account
                        sale.paid_to = account
                        sale.save()

                # Update Employee sales performance
                if employee:
                    employee.sales_performance += total_amount
                    employee.save()

                serializer = SaleSerializer(sale)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def return_sale(self, request, pk=None):
        try:
            with transaction.atomic():
                sale = Sale.objects.get(pk=pk)

                # Loop items and increment stock
                for item in sale.items.all():
                    product = item.product
                    stock = product.stock
                    stock.quantity += item.quantity
                    stock.save()

                    # Log Stock History
                    StockHistory.objects.create(
                        product=product,
                        quantity_changed=item.quantity,
                        action_type='Add',
                        description=f"Returned from Sale Invoice#{sale.invoice_number}",
                        average_cost=product.average_cost
                    )

                # Financial adjust
                if sale.payment_type == 'Credit' and sale.customer:
                    customer = sale.customer
                    customer.outstanding_balance -= sale.total_amount
                    customer.save()
                else:
                    if sale.paid_to:
                        account = sale.paid_to
                        account.balance -= sale.total_amount
                        account.save()

                # Adjust employee performance
                if sale.employee:
                    emp = sale.employee
                    emp.sales_performance -= sale.total_amount
                    emp.save()

                sale.delete() # Or mark as returned/inactive
                return Response({"message": "Sale returned successfully. Stock and financials adjusted."})
        except Sale.DoesNotExist:
            return Response({"error": "Sale invoice not found"}, status=status.HTTP_404_NOT_FOUND)

class CustomerPaymentViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerPaymentSerializer
    pagination_class = OptionalPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['customer__name', 'payment_to__name']
    ordering_fields = ['id', 'timestamp', 'amount']

    def get_queryset(self):
        queryset = CustomerPayment.objects.all().order_by('-timestamp')
        period = self.request.query_params.get('period')
        if period:
            start_date, end_date = get_date_range_for_period(period)
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                payment = serializer.save()

                # Decrease customer receivables
                customer = payment.customer
                customer.outstanding_balance -= payment.amount
                customer.save()

                # Increase chosen bank balance
                account = payment.payment_to
                account.balance += payment.amount
                account.save()

                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def dashboard_metrics(request):
    # Support filtering sales and profits by period
    period = request.query_params.get('period', 'all')
    start_date, end_date = get_date_range_for_period(period)

    sales_filter = {}
    if start_date:
        sales_filter['timestamp__date__gte'] = start_date
    if end_date:
        sales_filter['timestamp__date__lte'] = end_date

    sales_today = Sale.objects.filter(**sales_filter).aggregate(total=Sum('total_amount'))['total'] or Decimal(0)
    profit_today = Sale.objects.filter(**sales_filter).aggregate(total=Sum('profit'))['total'] or Decimal(0)

    # Cash in Hand
    cash_acct = BankAccount.objects.filter(name__icontains='Cash').first()
    cash_in_hand = cash_acct.balance if cash_acct else Decimal(0)

    # Bank Balance (Sum of all non-cash bank accounts)
    bank_balance = BankAccount.objects.exclude(name__icontains='Cash').aggregate(total=Sum('balance'))['total'] or Decimal(0)

    # Low Stock Items (Stock qty < 10)
    low_stock_count = Stock.objects.filter(quantity__lt=10).count()
    total_products_count = Product.objects.count()

    # Supplier Payables: split into me_payable_to_supplier and supplier_payable_to_me
    me_payable_to_supplier = Supplier.objects.filter(outstanding_balance__gt=0).aggregate(total=Sum('outstanding_balance'))['total'] or Decimal(0)
    supplier_payable_to_me = Supplier.objects.filter(outstanding_balance__lt=0).aggregate(total=Sum('outstanding_balance'))['total'] or Decimal(0)
    supplier_payable_to_me = abs(supplier_payable_to_me)

    # Pending Customer Receivables (Outstanding customer balances)
    customer_payable_to_me = Customer.objects.filter(outstanding_balance__gt=0).aggregate(total=Sum('outstanding_balance'))['total'] or Decimal(0)
    me_payable_to_customer = Customer.objects.filter(outstanding_balance__lt=0).aggregate(total=Sum('outstanding_balance'))['total'] or Decimal(0)
    me_payable_to_customer = abs(me_payable_to_customer)
    pending_customer_receivables = Customer.objects.aggregate(total=Sum('outstanding_balance'))['total'] or Decimal(0)

    # Inventory Valuation
    inventory_value_selling = Stock.objects.aggregate(
        total=Sum(F('quantity') * F('product__selling_price'))
    )['total'] or Decimal(0)
    inventory_value_cost = Stock.objects.aggregate(
        total=Sum(F('quantity') * F('product__average_cost'))
    )['total'] or Decimal(0)
    inventory_profit = inventory_value_selling - inventory_value_cost

    # Recent Sales / Purchases
    recent_sales = SaleSerializer(Sale.objects.all().order_by('-timestamp')[:5], many=True).data
    recent_purchases = PurchaseSerializer(Purchase.objects.all().order_by('-timestamp')[:5], many=True).data

    return Response({
        "sales_today": float(sales_today),
        "profit_today": float(profit_today),
        "cash_in_hand": float(cash_in_hand),
        "bank_balance": float(bank_balance),
        "low_stock_count": low_stock_count,
        "total_products_count": total_products_count,
        "me_payable_to_supplier": float(me_payable_to_supplier),
        "supplier_payable_to_me": float(supplier_payable_to_me),
        "customer_payable_to_me": float(customer_payable_to_me),
        "me_payable_to_customer": float(me_payable_to_customer),
        "pending_customer_receivables": float(pending_customer_receivables),
        "inventory_value_selling": float(inventory_value_selling),
        "inventory_value_cost": float(inventory_value_cost),
        "inventory_profit": float(inventory_profit),
        "recent_sales": recent_sales,
        "recent_purchases": recent_purchases
    })

@api_view(['GET'])
def reports_data(request):
    # Daily Sales
    today = datetime.date.today()
    sales_daily = []
    for i in range(7):
        date = today - datetime.timedelta(days=i)
        amt = Sale.objects.filter(timestamp__date=date).aggregate(total=Sum('total_amount'))['total'] or Decimal(0)
        prof = Sale.objects.filter(timestamp__date=date).aggregate(total=Sum('profit'))['total'] or Decimal(0)
        sales_daily.append({
            "date": date.strftime('%Y-%m-%d'),
            "sales": float(amt),
            "profit": float(prof)
        })
    sales_daily.reverse()

    period = request.query_params.get('period')
    best_sellers_qs = SaleItem.objects.all()
    expense_qs = Expense.objects.all()
    if period:
        start_date, end_date = get_date_range_for_period(period)
        if start_date:
            best_sellers_qs = best_sellers_qs.filter(sale__timestamp__date__gte=start_date)
            expense_qs = expense_qs.filter(timestamp__date__gte=start_date)
        if end_date:
            best_sellers_qs = best_sellers_qs.filter(sale__timestamp__date__lte=end_date)
            expense_qs = expense_qs.filter(timestamp__date__lte=end_date)

    # Best Selling Products
    best_sellers = best_sellers_qs.values('product__name').annotate(
        total_qty=Sum('quantity'),
        total_revenue=Sum(F('quantity') * F('unit_price'))
    ).order_by('-total_qty')[:5]

    # Expense breakdown
    expense_breakdown = expense_qs.values('category__name').annotate(
        total_amount=Sum('amount')
    ).order_by('-total_amount')

    # Supplier Balances
    supplier_balances = Supplier.objects.values('name', 'outstanding_balance').order_by('-outstanding_balance')[:5]

    # Customer Balances
    customer_balances = Customer.objects.values('name', 'outstanding_balance').order_by('-outstanding_balance')[:5]

    return Response({
        "sales_daily": sales_daily,
        "best_sellers": best_sellers,
        "expense_breakdown": expense_breakdown,
        "supplier_balances": supplier_balances,
        "customer_balances": customer_balances
    })

class EmployeeSalaryPaymentViewSet(viewsets.ModelViewSet):
    queryset = EmployeeSalaryPayment.objects.all().order_by('-timestamp')
    serializer_class = EmployeeSalaryPaymentSerializer
    pagination_class = OptionalPageNumberPagination

    def create(self, request, *args, **kwargs):
        employee_id = request.data.get('employee')
        basic_salary = Decimal(str(request.data.get('basic_salary', 0)))
        allowance = Decimal(str(request.data.get('allowance', 0)))
        paid_from_id = request.data.get('paid_from')
        description = request.data.get('description', '')

        from django.utils import timezone
        now = timezone.now()
        if EmployeeSalaryPayment.objects.filter(
            employee_id=employee_id,
            status='Paid',
            timestamp__year=now.year,
            timestamp__month=now.month
        ).exists():
            return Response({"error": "Salary payment has already been processed for this employee in the current month."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                employee = Employee.objects.get(pk=employee_id)
                
                pending_advances = EmployeeAdvance.objects.filter(employee=employee, status='Pending').order_by('timestamp')
                max_deduction = basic_salary + allowance
                deducted_advances = []
                total_deducted = Decimal('0.00')

                for adv in pending_advances:
                    if total_deducted + adv.amount <= max_deduction:
                        total_deducted += adv.amount
                        deducted_advances.append(adv)
                    else:
                        break

                net_pay = max_deduction - total_deducted

                account = BankAccount.objects.get(pk=paid_from_id)
                if account.balance < net_pay:
                    return Response({"error": "Insufficient funds in bank account for Net Pay"}, status=status.HTTP_400_BAD_REQUEST)

                account.balance -= net_pay
                account.save()

                salary_cat, _ = ExpenseCategory.objects.get_or_create(name="Employee Salaries")
                expense = Expense.objects.create(
                    category=salary_cat,
                    amount=net_pay,
                    payment_source=account,
                    description=f"Salary Net Pay to {employee.user.username} for {description}"
                )

                payment = EmployeeSalaryPayment.objects.create(
                    employee=employee,
                    basic_salary=basic_salary,
                    allowance=allowance,
                    advance=total_deducted,
                    total_paid=net_pay,
                    status='Paid',
                    description=description,
                    expense=expense,
                    paid_from=account
                )

                for adv in deducted_advances:
                    adv.status = 'Deducted'
                    adv.salary_payment = payment
                    adv.save()

                serializer = self.get_serializer(payment)
                EmployeePayrollAuditTrail.objects.create(
                    salary_payment=payment,
                    action='Processed',
                    new_data=serializer.data,
                    description="Payroll processed successfully"
                )

                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reverse_payroll(self, request, pk=None):
        try:
            with transaction.atomic():
                payment = self.get_object()
                if payment.status != 'Paid':
                    return Response({"error": "Only Paid payroll can be reversed"}, status=status.HTTP_400_BAD_REQUEST)

                payment.status = 'Reversed'
                payment.save()

                if payment.paid_from:
                    account = payment.paid_from
                    account.balance += payment.total_paid
                    account.save()

                if payment.expense:
                    expense = payment.expense
                    payment.expense = None
                    payment.save()
                    expense.delete()

                for adv in payment.deducted_advances.all():
                    adv.status = 'Pending'
                    adv.salary_payment = None
                    adv.save()

                EmployeePayrollAuditTrail.objects.create(
                    salary_payment=payment,
                    action='Reversed',
                    description="Payroll payment reversed successfully"
                )

                return Response({"message": "Payroll reversed successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def edit_payroll(self, request, pk=None):
        allowance = Decimal(str(request.data.get('allowance', 0)))
        basic_salary = Decimal(str(request.data.get('basic_salary', 0)))
        paid_from_id = request.data.get('paid_from')
        description = request.data.get('description', '')

        try:
            with transaction.atomic():
                payment = self.get_object()
                if payment.status != 'Paid':
                    return Response({"error": "Only Paid payroll can be edited"}, status=status.HTTP_400_BAD_REQUEST)

                old_serializer = self.get_serializer(payment)
                old_data = old_serializer.data

                if payment.paid_from:
                    old_acc = payment.paid_from
                    old_acc.balance += payment.total_paid
                    old_acc.save()

                old_advances = list(payment.deducted_advances.all())
                for adv in old_advances:
                    adv.status = 'Pending'
                    adv.salary_payment = None
                    adv.save()

                employee = payment.employee
                pending_advances = EmployeeAdvance.objects.filter(employee=employee, status='Pending').order_by('timestamp')
                max_deduction = basic_salary + allowance
                deducted_advances = []
                total_deducted = Decimal('0.00')

                for adv in pending_advances:
                    if total_deducted + adv.amount <= max_deduction:
                        total_deducted += adv.amount
                        deducted_advances.append(adv)
                    else:
                        break

                net_pay = max_deduction - total_deducted

                new_acc = BankAccount.objects.get(pk=paid_from_id)
                if new_acc.balance < net_pay:
                    raise Exception("Insufficient funds in bank account for recalculated Net Pay")

                new_acc.balance -= net_pay
                new_acc.save()

                if payment.expense:
                    expense = payment.expense
                    expense.amount = net_pay
                    expense.payment_source = new_acc
                    expense.description = f"Recalculated Salary Net Pay to {employee.user.username} for {description}"
                    expense.save()
                else:
                    salary_cat, _ = ExpenseCategory.objects.get_or_create(name="Employee Salaries")
                    expense = Expense.objects.create(
                        category=salary_cat,
                        amount=net_pay,
                        payment_source=new_acc,
                        description=f"Recalculated Salary Net Pay to {employee.user.username} for {description}"
                    )
                    payment.expense = expense

                payment.basic_salary = basic_salary
                payment.allowance = allowance
                payment.advance = total_deducted
                payment.total_paid = net_pay
                payment.paid_from = new_acc
                payment.description = description
                payment.save()

                for adv in deducted_advances:
                    adv.status = 'Deducted'
                    adv.salary_payment = payment
                    adv.save()

                new_serializer = self.get_serializer(payment)
                EmployeePayrollAuditTrail.objects.create(
                    salary_payment=payment,
                    action='Edited',
                    old_data=old_data,
                    new_data=new_serializer.data,
                    description=f"Payroll updated and recalculated"
                )

                return Response(new_serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def audit_trail(self, request, pk=None):
        payment = self.get_object()
        audits = payment.audit_trail.all().order_by('-timestamp')
        serializer = EmployeePayrollAuditTrailSerializer(audits, many=True)
        return Response(serializer.data)

class EmployeeAdvanceViewSet(viewsets.ModelViewSet):
    queryset = EmployeeAdvance.objects.all().order_by('-timestamp')
    serializer_class = EmployeeAdvanceSerializer
    pagination_class = OptionalPageNumberPagination

    def create(self, request, *args, **kwargs):
        employee_id = request.data.get('employee')
        amount = Decimal(str(request.data.get('amount', 0)))
        paid_from_id = request.data.get('paid_from')
        description = request.data.get('description', '')

        try:
            with transaction.atomic():
                employee = Employee.objects.get(pk=employee_id)
                account = BankAccount.objects.get(pk=paid_from_id)

                if account.balance < amount:
                    return Response({"error": "Insufficient funds in bank account for advance payment"}, status=status.HTTP_400_BAD_REQUEST)

                account.balance -= amount
                account.save()

                advance_cat, _ = ExpenseCategory.objects.get_or_create(name="Salary Advances")
                expense = Expense.objects.create(
                    category=advance_cat,
                    amount=amount,
                    payment_source=account,
                    description=f"Salary Advance to {employee.user.username} - {description}"
                )

                advance = EmployeeAdvance.objects.create(
                    employee=employee,
                    amount=amount,
                    status='Pending',
                    description=description,
                    expense=expense,
                    paid_from=account
                )

                serializer = self.get_serializer(advance)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reverse_advance(self, request, pk=None):
        try:
            with transaction.atomic():
                advance = self.get_object()
                if advance.status != 'Pending':
                    return Response({"error": "Only Pending advances can be reversed"}, status=status.HTTP_400_BAD_REQUEST)

                advance.status = 'Reversed'
                advance.save()

                if advance.paid_from:
                    account = advance.paid_from
                    account.balance += advance.amount
                    account.save()

                if advance.expense:
                    expense = advance.expense
                    advance.expense = None
                    advance.save()
                    expense.delete()

                return Response({"message": "Advance reversed successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class EmployeeAttendanceViewSet(viewsets.ModelViewSet):
    queryset = EmployeeAttendance.objects.all().order_by('-date')
    serializer_class = EmployeeAttendanceSerializer
    pagination_class = OptionalPageNumberPagination

    def get_queryset(self):
        queryset = EmployeeAttendance.objects.all().order_by('-date')
        employee_id = self.request.query_params.get('employee_id')
        month = self.request.query_params.get('month')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if month:
            parts = month.split('-')
            if len(parts) == 2:
                queryset = queryset.filter(date__year=parts[0], date__month=parts[1])
        return queryset

    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        employee_id = request.data.get('employee_id')
        records = request.data.get('records', [])

        if not employee_id:
            return Response({"error": "employee_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                for record in records:
                    date_val = record.get('date')
                    status_val = record.get('status')
                    if not date_val or not status_val:
                        continue
                    EmployeeAttendance.objects.update_or_create(
                        employee_id=employee_id,
                        date=date_val,
                        defaults={'status': status_val}
                    )
                return Response({"message": "Attendance marked successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def parse_version_tuple(version_str):
    try:
        parts = [int(x) for x in version_str.strip().split('.')]
    except ValueError:
        parts = []
        for x in version_str.strip().split('.'):
            digits = []
            for char in x:
                if char.isdigit():
                    digits.append(char)
                else:
                    break
            parts.append(int("".join(digits)) if digits else 0)
    
    # Pad to at least 3 parts (e.g. 1.0 -> 1.0.0) to ensure accurate semantic comparison
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def check_ota_update(request):
    """
    Checks if a newer web asset bundle or APK reinstallation is available.
    Supports is_test_device payload to check for updates that are still in testing mode.
    """
    from .models import OTAUpdateBundle

    platform = request.data.get("platform", "android")
    native_version_str = request.data.get("native_version")
    web_version_str = request.data.get("web_version")
    is_test_device = request.data.get("is_test_device", False)

    if not native_version_str or not web_version_str:
        return Response(
            {"error": "Missing native_version or web_version in request body."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Filter based on test device status
    if is_test_device:
        # Test devices get the latest active bundle (regardless of is_testing)
        latest_update = OTAUpdateBundle.objects.filter(is_active=True).first()
    else:
        # Regular devices only get the latest active bundle that has been approved (is_testing=False)
        latest_update = OTAUpdateBundle.objects.filter(is_active=True, is_testing=False).first()

    if not latest_update:
        return Response({"update_available": False})

    try:
        client_native = parse_version_tuple(native_version_str)
        client_web = parse_version_tuple(web_version_str)
        req_native = parse_version_tuple(latest_update.native_version_required)
        target_web = parse_version_tuple(latest_update.version)
    except Exception as e:
        return Response(
            {"error": f"Invalid version format supplied: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # If user's APK native wrapper is too old for this bundle
    if client_native < req_native:
        if platform == "electron":
            exe_download_url = request.build_absolute_uri("/media/apps/latest-axon.exe")
            return Response({
                "update_available": True,
                "update_type": "APK_REINSTALL",
                "message": "A major desktop app update is required. Please download the new Windows application.",
                "download_url": exe_download_url
            })
        else:
            apk_download_url = request.build_absolute_uri("/media/apks/latest-axon.apk")
            return Response({
                "update_available": True,
                "update_type": "APK_REINSTALL",
                "message": "A major native app update is required. Please download the new APK.",
                "download_url": apk_download_url
            })

    # If a newer web asset version is available
    if client_web < target_web:
        bundle_url = request.build_absolute_uri(latest_update.zip_file.url)
        return Response({
            "update_available": True,
            "update_type": "OTA_UPDATE",
            "version": latest_update.version,
            "download_url": bundle_url,
            "checksum": latest_update.checksum,
            "is_mandatory": latest_update.is_mandatory,
            "release_notes": latest_update.release_notes
        })

    return Response({"update_available": False})

