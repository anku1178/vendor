-- MIGRATION SCRIPT FOR ADDING MEASUREMENT UNITS
-- Run this securely in the Supabase SQL Editor.

-- 1. Add the column to purchases, defaulting existing to 'piece'
alter table purchases add column if not exists unit text not null default 'piece';

-- 2. Add the column to inventory, defaulting existing to 'piece'
alter table inventory add column if not exists unit text not null default 'piece';

-- 3. We must change the UNIQUE constraint on inventory so that "Rice (kg)" and "Rice (bag)" can exist.
do $$
declare
    constraint_name text;
begin
    -- Find the existing unique constraint name dynamically for item_name
    select conname into constraint_name
    from pg_constraint
    where conrelid = 'inventory'::regclass
      and contype = 'u'
    limit 1;

    -- Drop it if it exists
    if constraint_name is not null then
        execute format('alter table inventory drop constraint %I', constraint_name);
    end if;
end $$;

-- Add the new composite constraint
alter table inventory add constraint inventory_item_name_unit_key unique (item_name, unit);

-- 4. Overhaul the trigger to calculate stock by UNIT
create or replace function update_inventory_stock()
returns trigger as $$
begin
    if (TG_OP = 'DELETE') then
        -- Subtract the deleted quantity
        update inventory set stock = stock - old.quantity 
        where item_name = old.item_name and unit = old.unit;
        return old;
    elsif (TG_OP = 'UPDATE') then
        -- Undo old
        update inventory set stock = stock - old.quantity 
        where item_name = old.item_name and unit = old.unit;
        
        -- Apply new
        insert into inventory (item_name, unit, stock)
        values (new.item_name, new.unit, new.quantity)
        on conflict (item_name, unit) do update set stock = inventory.stock + new.quantity;
        return new;
    elsif (TG_OP = 'INSERT') then
        insert into inventory (item_name, unit, stock)
        values (new.item_name, new.unit, new.quantity)
        on conflict (item_name, unit) do update set stock = inventory.stock + new.quantity;
        return new;
    end if;
end;
$$ language plpgsql;
