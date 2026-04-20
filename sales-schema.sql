-- =============================================
-- SALES TABLE & STOCK DEDUCTION TRIGGER
-- =============================================
-- Run this SQL in your Supabase SQL Editor
-- after the initial database-schema.sql

-- 1. Sales table
create table if not exists sales (
    id uuid primary key default uuid_generate_v4(),
    item_name text not null,
    quantity_sold integer not null check (quantity_sold > 0),
    sale_price numeric not null check (sale_price >= 0),
    sale_date date not null default current_date
);

-- 2. Disable RLS for sales table
alter table sales disable row level security;

-- 3. Trigger function: subtract stock on sale
create or replace function deduct_inventory_stock()
returns trigger as $$
begin
    update inventory
    set stock = stock - new.quantity_sold
    where item_name = new.item_name;

    return new;
end;
$$ language plpgsql;

-- 4. Attach trigger to sales table
drop trigger if exists tr_deduct_inventory on sales;

create trigger tr_deduct_inventory
after insert on sales
for each row
execute function deduct_inventory_stock();
