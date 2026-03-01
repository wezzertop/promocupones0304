-- Copia y pega todo este contenido en el SQL Editor de tu proyecto Supabase para arreglar los permisos de comentarios

-- 1. Asegurar que RLS está activo
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas anteriores para evitar errores de "ya existe"
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Public comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated insert" ON public.comments;

-- 3. Crear política de LECTURA (SELECT) para todos (público)
-- Esto permite que cualquiera vea los comentarios, incluso sin loguearse
CREATE POLICY "Comments are viewable by everyone"
ON public.comments
FOR SELECT
TO anon, authenticated
USING (true);

-- 4. Crear política de INSERCIÓN (INSERT) para usuarios autenticados
-- Esto permite crear comentarios SOLO si el user_id coincide con tu usuario actual
CREATE POLICY "Authenticated users can comment"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Crear políticas de EDICIÓN/BORRADO (UPDATE/DELETE) para dueños
CREATE POLICY "Users can update own comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
