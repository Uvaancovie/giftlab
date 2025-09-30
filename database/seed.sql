insert into products (sku,title,description,price_cents,currency,image_url,stock,is_active)
values
('GL-RET-001','Luxury Mug Set','Matte black mug with gold trim',29900,'ZAR',null,50,true),
('GL-RET-002','Notebook A5','Hardcover dotted notebook',18900,'ZAR',null,100,true)
on conflict (sku) do nothing;