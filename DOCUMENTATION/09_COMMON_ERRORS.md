# 09 - Troubleshooting & Common Errors: SHOPNEST

This guide details common development errors, why they occur, and step-by-step solutions for fresh developers.

---

## 1. PostgreSQL Connection Errors

### Error: `django.db.utils.OperationalError: connection to server at "localhost", port 5432 failed: Connection refused`
- **Cause**: The PostgreSQL database service is stopped or not running on your machine.
- **Solution (Windows PowerShell as Administrator)**:
  ```powershell
  # Check service status
  Get-Service -Name postgresql*

  # Start PostgreSQL service
  Start-Service postgresql-x64-16  # (or your version number)
  ```
  Alternatively, open `services.msc` via Windows Run (`Win + R`), scroll to "postgresql-x64", right-click, and select **Start**.

### Error: `django.db.utils.OperationalError: FATAL: password authentication failed for user "postgres"`
- **Cause**: The password specified in `backend/.env` does not match the actual master password of your PostgreSQL user `postgres`.
- **Solution**:
  1. Open `backend/.env`.
  2. Verify and correct `DB_PASSWORD=...`.
  3. Test directly in terminal: `psql -U postgres -h localhost`.

### Error: `django.db.utils.OperationalError: FATAL: database "ecommerce" does not exist`
- **Cause**: You haven't created the PostgreSQL database yet.
- **Solution**:
  ```powershell
  psql -U postgres -c "CREATE DATABASE ecommerce;"
  ```

---

## 2. CORS (Cross-Origin Resource Sharing) Errors

### Error: `Access to XMLHttpRequest at 'http://localhost:8000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy`
- **Cause**: The browser enforces security preventing web pages from making requests to a different port (`5173` vs `8000`) unless the server explicitly grants permission via HTTP response headers.
- **Solution**:
  In `backend/backend/settings.py`:
  1. Verify `'corsheaders'` is inside `INSTALLED_APPS`.
  2. Verify `'corsheaders.middleware.CorsMiddleware'` is at the very top of `MIDDLEWARE`:
     ```python
     MIDDLEWARE = [
         'corsheaders.middleware.CorsMiddleware',
         'django.middleware.security.SecurityMiddleware',
         ...
     ]
     ```
  3. Ensure the frontend port is whitelisted in `CORS_ALLOWED_ORIGINS`:
     ```python
     CORS_ALLOWED_ORIGINS = [
         'http://localhost:5173',
         'http://127.0.0.1:5173',
     ]
     ```

---

## 3. Frontend / NPM Errors

### Error: `'vite' is not recognized as an internal or external command`
- **Cause**: Dependencies were either not installed, or `node_modules/.bin` is missing.
- **Solution**:
  Open PowerShell in the `frontend` directory and run:
  ```powershell
  cd C:\Users\Dell\Desktop\ECOMMERCE_PROJECT\frontend
  npm install
  npm run dev
  ```

### Error: `npm ERR! ENOSPC: no space left on device`
- **Cause**: Low disk space on drive `C:`.
- **Solution**:
  1. Clean npm cache: `npm cache clean --force`.
  2. Empty your Windows Recycle Bin and `%TEMP%` folder (`Win + R` → `%temp%` → Delete).
  3. Run `npm install --no-audit --no-fund --prefer-offline` to minimize downloaded metadata.

---

## 4. HTTP Status Code Errors

### HTTP 401 Unauthorized
- **Cause**: An endpoint protected by `@permission_classes([IsAuthenticated])` (like `/api/cart/` or `/api/orders/checkout/`) was called without a valid `Authorization: Token <key>` header.
- **Solution**: Check browser Developer Tools (F12) → Application → Local Storage. Verify that `shopnest_token` exists. If not, log in again.

### HTTP 403 Forbidden
- **Cause**: The customer account is deactivated (`is_active=False`) or an unprivileged user tried to access an administrative operation.

### HTTP 404 Not Found
- **Cause**:
  1. Product ID does not exist in the database.
  2. Customer tried to view another customer's order (enforced data isolation!).
  3. Typo in URL path (ensure trailing slash matches `urls.py`, e.g. `/api/cart/add/`).

### HTTP 500 Internal Server Error
- **Cause**: An unhandled Python exception occurred on the backend.
- **Solution**: Look at the terminal running `python manage.py runserver`. Django outputs a detailed Python traceback showing the exact file and line number where the exception occurred.

---

## 5. Migration Conflicts

### Error: `django.db.migrations.exceptions.InconsistentMigrationHistory`
- **Cause**: Manually deleting migration files or editing database tables directly in PostgreSQL without running `makemigrations`.
- **Solution**:
  Always use Django's migration workflow:
  ```powershell
  python manage.py makemigrations
  python manage.py migrate
  ```
  Never delete migration files inside `store/migrations/` once applied!
