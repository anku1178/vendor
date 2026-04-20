-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Vendors table
create table if not exists vendors (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique
);

-- 2. Inventory table
create table if not exists inventory (
    id uuid primary key default uuid_generate_v4(),
    item_name text not null unique,
    stock integer not null default 0
);

-- 3. Purchases table
create table if not exists purchases (
    id uuid primary key default uuid_generate_v4(),
    vendor_id uuid references vendors(id) on delete cascade,
    item_name text not null,
    quantity integer not null check (quantity > 0),
    price numeric not null check (price >= 0),
    purchase_date date not null default current_date
);

-- Add updated_at column to all tables for tracking 
-- (Not strictly requested but good practice)
-- create extension if not exists moddatetime;
-- Add later if needed.

-- Function and trigger to update inventory automatically
create or replace function update_inventory_stock()
returns trigger as $$
begin
    insert into inventory (item_name, stock)
    values (new.item_name, new.quantity)
    on conflict (item_name)
    do update set stock = inventory.stock + new.quantity;
    
    return new;
end;
$$ language plpgsql;

drop trigger if exists tr_update_inventory on purchases;

create trigger tr_update_inventory
after insert on purchases
for each row
execute function update_inventory_stock();

-- ----------------------------------------------------
-- SECURITY CONFIGURATION
-- ----------------------------------------------------
-- Since this is an internal dashboard without login/auth, 
-- we need to disable Row Level Security (RLS) so the 
-- frontend app can freely insert and read the database.

alter table vendors disable row level security;
alter table inventory disable row level security;
alter table purchases disable row level security;
