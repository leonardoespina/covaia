-- Seed: Unidades iniciales de la ZODI N°62
INSERT INTO unidades (nombre, tipo, efectivos_asignados) VALUES
  ('Puesto Control Norte - Río Carapo', 'PUESTO_CONTROL', 8),
  ('Puesto Control Sur - Km 45', 'PUESTO_CONTROL', 6),
  ('Patrulla Móvil Alpha', 'PATRULLA_MOVIL', 4),
  ('Patrulla Móvil Bravo', 'PATRULLA_MOVIL', 4)
ON CONFLICT DO NOTHING;

-- Seed: Usuario administrador inicial
-- Password: Admin2026! (cambiar en producción)
INSERT INTO usuarios (nombre, cedula, rango, rol, password_hash) VALUES
  ('Sistema Administrador', '00000000', 'N/A', 'ADMIN_SISTEMA',
   '$2b$10$rOzJqKqKqKqKqKqKqKqKqOzJqKqKqKqKqKqKqKqKqKqKqKqKqKqKq')
ON CONFLICT DO NOTHING;
