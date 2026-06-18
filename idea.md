Here is the updated ERP structure incorporating the logic for purchasing-based price updates and selling price overrides (both higher and lower) in both the standard Sales and POS modules.



### ERP System Structure (`:8000/epr`)

#### 1. /Dashboard
* Today's Sales
* Today's Profit (Calculated from actual transaction selling prices, not default prices)
* Cash in Hand
* Bank Balance
* Low Stock Items
* Pending Supplier Payments
* Recent Sales
* Recent Purchases

---

#### 2. /Products
* Add Product  
  * **[Automatic Action]**: Automatically initializes a corresponding record in the Stock module with a quantity of `0`.
* Product Categories
* Brands
* Product Images
* Product Variants (Color, Model, Size)
* **Selling Price** (This is the default recommended retail price; can be updated manually here, adjusted during product receiving, or overridden per-sale in Sales/POS).
* Cost Price
* average_cost (cached, Weighted Average Cost - WAC)  
  * **[Automatic Action]**: Automatically recalculates upon receiving purchases using the formula:  
    `((Current Stock * Existing WAC) + (New Purchase Qty * Purchase Cost)) / (Current Stock + New Purchase Qty)`
* last_landed_cost (cached)  
  * **[Automatic Action]**: Updates automatically to the unit cost of the latest received purchase (including pro-rated shipping, customs, and delivery costs).
* **Profit per item** (Theoretical profit based on default price)  
  * **[Automatic Action]**: Dynamically recalculates as `Default Selling Price - average_cost` whenever the selling price or average cost updates.
* Barcode show live
* Product Status (Active/Inactive)

---

#### 3. /Stock (Inventory)
* Current Stock
* Add Stock  
  * **[Automatic Action]**: Automatically creates an entry in the Stock History log.
* Remove Stock  
  * **[Automatic Action]**: Automatically creates an entry in the Stock History log.
* Stock Transfer  
  * **[Automatic Action]**: Decrements stock from the source location, increments stock at the destination location, and logs a record in the Stock History.
* Stock Adjustment  
  * **[Automatic Action]**: Updates the current stock count to match the physical count and logs an adjustment transaction in the Stock History.
* Damaged Items  
  * **[Automatic Action]**: Decrements current stock and automatically logs a corresponding loss/expense entry in the /Expenses module.
* Stock Count
* Low Stock Alerts
* Stock History

---

#### 4. /Suppliers
* Supplier List
* Contact Information
* Purchase History
* Outstanding Balance  
  * **[Automatic Action]**: Automatically increases when a purchase invoice is received on credit, and decreases when a supplier payment is recorded.
* Payment History (Payment type, credit or debit)
* Add New Supplier

---

#### 5. /Customers
* Customer List
* Contact Information
* Credit Limit Configuration
* Outstanding Balance / Receivables  
  * **[Automatic Action]**: Automatically increases when a credit sale is processed, and decreases when a customer payment is received.
* Payment History (Credit/Debit/Adjustments)
* Add New Customer

---

#### 6. /Purchases
* Create Purchase Order (print) with barcode
* **Receive Products**  
  * **New Feature**: Includes an input field to optionally update/change the default **Selling Price** in the `/Products` module if the new purchase cost warrants a retail price change.
  * **[Automatic Action]**: 
    1. Increments current quantities in the /Stock module.
    2. Triggers the recalculation of `average_cost` and updates `last_landed_cost` in the /Products module.
    3. Updates the default **Selling Price** in `/Products` if the user entered a new retail price on this screen.
    4. If purchased on credit, automatically increases the supplier's Outstanding Balance. If paid immediately, decreases the chosen Cash/Bank balance in /Money & Accounts.
* Purchase Return  
  * **[Automatic Action]**: 
    1. Decrements the return quantities in the /Stock module.
    2. Decreases the supplier's Outstanding Balance (if bought on credit) or increases Cash/Bank balances (if cash refund is issued).
* Supplier Payment  
  * **[Automatic Action]**: Decreases the supplier's Outstanding Balance and simultaneously decreases the selected Cash/Bank balance in the /Money & Accounts module.
* Additional Costs (Shipping, Customs, Delivery - Transportation tied directly with purchase for accurate landed cost)  
  * **[Automatic Action]**: Allocates these costs proportionally across the received products to recalculate their `last_landed_cost` and updated `average_cost`.
* Purchase History

---

#### 7. /Money & Accounts
* Cash & Banks
  * Cash in Hand
  * Bank Accounts (Support for multiple bank accounts)
  * Transfer Money  
    * **[Automatic Action]**: Decreases the balance of the source account and increases the balance of the destination account.
* Add Income  
  * Record external income (e.g., supplier rebates, rewards, interest, or miscellaneous non-sales income).
  * **[Automatic Action]**: 
    1. Increases the selected Cash or Bank account balance in /Money & Accounts.
    2. If designated as a "Supplier Rebate" applied as account credit, it automatically decreases the Outstanding Balance of that supplier in the /Suppliers module.
    3. Updates the Financial Reports (Income Report, Profit & Loss, and Cash Flow Report) dynamically.
* Business Owners
  * Owner Investment / Withdrawal  
    * **[Automatic Action]**: Adjusts the selected Cash/Bank account balance and updates the equity/capital ledger.
  * Partner Investment / Withdrawal  
    * **[Automatic Action]**: Adjusts the selected Cash/Bank account balance and updates the partner equity ledger.
* Financial Reports
  * Profit & Loss
  * Income Report
  * Expense Report
  * Cash Flow Report

---

#### 8. /Expenses
* Add Expense  
  * **[Automatic Action]**: Decreases the selected Cash/Bank account balance in /Money & Accounts.
* Assets (company asset add)  
  * **[Automatic Action]**: Decreases the selected Cash/Bank account balance (if paid in full), or increases accounts payable/liabilities (if acquired on credit).
* Expense Categories
* Upload Receipt
* Expense History
* Recurring Expenses  
  * **[Automatic Action]**: Auto-generates draft expense invoices in the system on the scheduled dates and sends a system notification for review.

---

#### 9. /Employees
* Employee List
* Roles (Owner, Manager, Cashier, Store Keeper)
* Permissions
* Attendance (Optional)
* Sales Performance  
  * **[Automatic Action]**: Automatically updates the employee's sales performance metrics whenever a sale/POS transaction containing their employee ID is completed.
* Activity History

---

#### 10. /visual Reports
* Sales Reports: Daily, Weekly, Monthly, Best Selling Products (Derived from actual transaction-level pricing).
* Stock Reports: Current Stock, Low Stock Items, Damaged Items
* Purchase Reports: Purchases by Supplier, Supplier Balances
* Financial Reports: Profit & Loss, Expenses, Cash Flow
* Customer Reports: Top Customers, Customer Balances (linked with /customers module)

---

#### 11. /Sales
* Create Sale
* Sales History
* Sales Return  
  * **[Automatic Action]**: 
    1. Increments current quantities in the /Stock module.
    2. Refunds Cash/Bank balances (if cash refund) or decreases Outstanding Balance in the /Customers module (if store credit refund) based on the actual price paid at the time of sale.
* Credit Sale  
  * **[Automatic Action]**: Verifies if the sale amount is within the customer's Credit Limit Configuration. If approved, increases the customer's Outstanding Balance in the /Customers module.
* Customer Payment  
  * **[Automatic Action]**: Decreases the customer's Outstanding Balance and increases the designated Cash/Bank account balance.
* **Sale Information**: Invoice Number, Date, Customer, Products, Quantity, **Selling Price (Defaults to product selling price, but can be manually changed higher or lower per line item)**, Discount, Total Amount, Payment Type (Cash / Bank / Credit)
* **Automatic Actions**: Reduce Stock, Update Cash or Bank Balance, Calculate Profit  
  * **[Automatic Action]**: Upon transaction completion:
    1. Decreases item quantities in the /Stock module.
    2. Increases the selected Cash/Bank balance (for cash/bank sales) or increases Customer Outstanding Balance (for credit sales).
    3. Calculates transaction profit using the formula:  
       `Actual Transacted Unit Price - average_cost` (instead of default price) and saves it to the transaction record for the dashboard and reports.

---

#### POS
* Search Product
* Scan Barcode
* Add to Cart
* Change Quantity
* **Price Override (Sell Higher/Lower)**  
  * **Feature**: Displays the default product selling price in the cart. Allows cashiers (subject to permission controls) to tap the price and manually type a different unit price (higher or lower) for the transaction.
* Apply Discount
* Select Customer (Note: Linked directly to /customers for lookup and credit sales)
* Choose Payment Method (Cash, Bank, Credit)
* Print Receipt
* Complete Sale (Note: Reduces stock, updates accounts, and logs invoice instantly)  
  * **[Automatic Action]**: 
    1. Decreases item quantities in the /Stock module.
    2. Increases the selected Cash/Bank balance (if paid via Cash/Bank) or updates Outstanding Balance in the /Customers module (if paid via Credit, based on the overridden transaction price).
    3. Logs the transaction to the Sales History using the actual transacted price and updates the /Dashboard metrics.