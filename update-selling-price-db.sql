-- MIGRATION SCRIPT FOR ADDING SELLING PRICE
-- Run this securely in the Supabase SQL Editor.

-- 1. Add the column to purchases, defaulting existing to 0
alter table purchases add column if not exists selling_price numeric not null default 0;

-- 2. Add the column to inventory, defaulting existing to 0
alter table inventory add column if not exists selling_price numeric not null default 0;

-- 3. Overhaul the trigger to update stock AND selling_price by UNIT
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
        insert into inventory (item_name, unit, stock, selling_price)
        values (new.item_name, new.unit, new.quantity, new.selling_price)
        on conflict (item_name, unit) do update set 
            stock = inventory.stock + new.quantity,
            selling_price = new.selling_price;
        return new;
    elsif (TG_OP = 'INSERT') then
        insert into inventory (item_name, unit, stock, selling_price)
        values (new.item_name, new.unit, new.quantity, new.selling_price)
        on conflict (item_name, unit) do update set 
            stock = inventory.stock + new.quantity,
            selling_price = new.selling_price;
        return new;
    end if;
end;
$$ language plpgsql;
