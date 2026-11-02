# 08 - Setup & Execution Guide: SHOPNEST

This guide provides the exact **Windows PowerShell** commands to set up, configure, and run both the Django backend and React frontend.

---

## Prerequisites Check

Before starting, ensure you have the following installed on your machine:
- **Python 3.10+** (Verify via: `python --version`)
- **Node.js 18+ and npm** (Verify via: `node -v` and `npm -v`)
- **PostgreSQL 14+** (Service running on `localhost:5432`)

---

## Step 1: PostgreSQL Database Setup

1. Open PowerShell and launch the PostgreSQL command-line tool `psql`:
   ```powershell
   psql -U postgres
   ```
2. Enter your PostgreSQL master password when prompted.
3. In the `psql` prompt, create the database:
   ```sql
   CREATE DATABASE ecommerce;
   \q
   ```

---

## Step 2: Backend Configuration & Startup

Open **Terminal 1** in PowerShell and navigate to the `backend` directory:

```powershell
cd C:\Users\Dell\Desktop\ECOMMERCE_PROJECT\backend
```

### 1. (Optional) Create & Activate Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(If PowerShell displays an execution policy restriction, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

### 2. Verify / Install Backend Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Ensure `backend/.env` exists and contains your PostgreSQL credentials:
```ini
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=django-insecure-d%6o5$462av=+w$hb%nu35j1+p1c282yc735$@6i(5*&m(2u8+
DEBUG=True
```

### 4. Run System Check & Database Migrations
```powershell
python manage.py check
python manage.py makemigrations
python manage.py migrate
```

### 5. Create an Administrator Superuser
```powershell
python manage.py createsuperuser
```
Follow the interactive prompts to create your store administrator account.

### 6. Seed Realistic Sample Categories & Products
```powershell
python manage.py load_sample_data
```

### 7. Run Automated Tests
Verify all 12 test suites and 15 workflow verifications pass:
```powershell
python manage.py test store
python test_workflow.py
```

### 8. Start the Django Development Server
```powershell
python manage.py runserver 8000
```
- API Base URL: `http://localhost:8000/api/`
- Admin Dashboard: `http://localhost:8000/admin/`

---

## Step 3: Frontend Configuration & Startup

Open **Terminal 2** in PowerShell and navigate to the `frontend` directory:

```powershell
cd C:\Users\Dell\Desktop\ECOMMERCE_PROJECT\frontend
```

### 1. Install Required Dependencies
Dependencies are already configured in `package.json` (`react`, `react-dom`, `react-router-dom`, `axios`, and `vite`).
If not installed or if running on a fresh clone:
```powershell
npm install --no-audit --no-fund
```

### 2. Verify Production Build (Zero Errors)
```powershell
npm run build
```

### 3. Start the Vite Development Server
```powershell
npm run dev
```
- Browser URL: `http://localhost:5173/`

---

## Step 4: Accessing the Complete Application

1. Open your browser and navigate to:
   **`http://localhost:5173`**
2. Browse products, explore category filters, and test search.
3. Sign in or register:
   - Click **Register** to create a fresh customer account.
   - Or log in with your administrator credentials created in step 5.
4. Add products to your cart, visit `/cart`, and proceed through `/checkout`.
5. Confirm the order via **Cash on Delivery**.
6. View your order under **My Orders** (`/orders`) and test eligible order cancellation.
7. Open **`http://localhost:8000/admin/`** in another tab to see the order in the Django Admin panel.
