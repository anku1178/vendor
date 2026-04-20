-- RUN THIS IN SUPABASE SQL EDITOR TO UPGRADE TRIGGERS FOR CRUD
-- It replaces your old insert-only triggers with full insert/update/delete ones.

create or replace function update_inventory_stock()
returns trigger as $$
begin
    if (TG_OP = 'DELETE') then
        -- Subtract the deleted quantity
        update inventory set stock = stock - old.quantity where item_name = old.item_name;
        return old;
    elsif (TG_OP = 'UPDATE') then
        -- Undo old, apply new
        update inventory set stock = stock - old.quantity where item_name = old.item_name;
        insert into inventory (item_name, stock)
        values (new.item_name, new.quantity)
        on conflict (item_name) do update set stock = inventory.stock + new.quantity;
        return new;
    elsif (TG_OP = 'INSERT') then
        insert into inventory (item_name, stock)
        values (new.item_name, new.quantity)
        on conflict (item_name) do update set stock = inventory.stock + new.quantity;
        return new;
    end if;
end;
$$ language plpgsql;

drop trigger if exists tr_update_inventory on purchases;

create trigger tr_update_inventory
after insert or update or delete on purchases
for each row
execute function update_inventory_stock();


create or replace function deduct_inventory_stock()
returns trigger as $$
begin
    if (TG_OP = 'DELETE') then
        -- Add back the sold quantity
        update inventory set stock = stock + old.quantity_sold where item_name = old.item_name;
        return old;
    elsif (TG_OP = 'UPDATE') then
        -- Undo old, apply new
        update inventory set stock = stock + old.quantity_sold where item_name = old.item_name;
        update inventory set stock = stock - new.quantity_sold where item_name = new.item_name;
        return new;
    elsif (TG_OP = 'INSERT') then
        update inventory set stock = stock - new.quantity_sold where item_name = new.item_name;
        return new;
    end if;
end;
$$ language plpgsql;

drop trigger if exists tr_deduct_inventory on sales;

create trigger tr_deduct_inventory
after insert or update or delete on sales
for each row
execute function deduct_inventory_stock();
