-- Allocator de códigos INS-NNNN para insumos creados por el admin (#222). La
-- semilla 0037/0038 sembró hasta INS-0211 con códigos fijos; las altas vía la
-- API de gestión necesitan el siguiente código libre, único y monótono.
--
-- Se usa una SEQUENCE nativa (nextval) sembrada por encima del máximo actual.
-- Idempotente: CREATE SEQUENCE IF NOT EXISTS no re-crea; el setval reposiciona
-- la secuencia al máximo real cada vez que migrate.sh aplica el fichero (sólo
-- una vez en prod, rastreado por nombre). En el test global-setup la BD arranca
-- limpia con la semilla aplicada, así que MAX = 211 y el próximo nextval = 212.
CREATE SEQUENCE IF NOT EXISTS "supply_code_seq";
--> statement-breakpoint
-- Posiciona la secuencia tras el máximo actual. Con tabla sembrada (MAX=211)
-- is_called=true → el próximo nextval = 212. Con tabla vacía, is_called=false
-- y valor 1 → el próximo nextval = 1 (no se salta INS-0001).
SELECT setval(
  'supply_code_seq',
  GREATEST(m.maxnum, 1),
  m.maxnum IS NOT NULL
)
FROM (
  SELECT MAX(substring("code" FROM 5)::int) AS maxnum FROM "supplies"
) AS m;
