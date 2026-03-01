
-- Modificar la tabla deals para agregar los nuevos campos
ALTER TABLE deals
ADD COLUMN coupon_code TEXT,
ADD COLUMN availability TEXT CHECK (availability IN ('online', 'in_store')),
ADD COLUMN shipping_cost DECIMAL(10, 2),
ADD COLUMN shipping_country TEXT, -- Podría ser un array o una tabla relacionada, por simplicidad TEXT por ahora
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;

-- Asegurar que expires_at ya existe, si no, agregarlo (ya existe en el esquema actual)
-- ALTER TABLE deals ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
