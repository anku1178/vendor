# Vendor Purchases Dashboard

A clean, full-stack React web application designed for small shopkeepers to seamlessly track and manage their vendor purchases, spending across items, and local inventory stock.

## 🚀 Features
- **Intuitive Dashboard:** A single-glance dashboard that breaks down your total spend, active vendors, purchase volume, and automatically plots your vendor spending distribution and item-price trends.
- **Easy Purchase Logging:** Form-based entries that support live dropdown associations with existing vendors or rapid inline addition of new vendors.
- **Stock Management:** Built-in connection to automatically track physical stock movements via Supabase database triggers.
- **Data Filtering:** Dynamic table overview to search, review, and filter through all existing purchase records by date, vendor, item, quantity, and cost.

## 💻 Tech Stack
- **Frontend Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing:** [React Router v6](https://reactrouter.com/)
- **Visuals & Charts:** Vanilla CSS (custom design system) + [Recharts](https://recharts.org/) + [Lucide Icons](https://lucide.dev/)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL & REST API)

## 🛠 Setup & Installation

**1. Clone the Repository:**
```bash
git clone https://github.com/anku1178/vendor.git
cd vendor
```

**2. Install Dependencies:**
```bash
npm install
```

**3. Database Configuration:**
- Ensure you have a Supabase account and a newly created project.
- Get your Supabase Project URL and Anon Key.
- Copy the provided template: `cp .env.example .env`
- Add your variables inside `.env`:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your.anon.key.here
  ```

**4. Execute Database Schema:**
Open your Supabase SQL Editor and run the provided SQL definitions found in `database-schema.sql`. This file contains the complete migration instructions including:
- Creating the `vendors`, `purchases`, and `inventory` tables.
- Building the automated stock calculation function & trigger.
- Disabling Row-Level Security for swift local or internal usage.

**5. Start the Application:**
```bash
npm run dev
```

Your app will hot-reload and immediately interface accurately with your active Supabase database!
