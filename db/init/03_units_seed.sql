-- Seed de unidades operacionales de la ZODI N°62 Bolívar
-- Puestos de Control y Patrullas disponibles para despacho

INSERT INTO unidades (id, nombre, tipo, efectivos_asignados, activa) VALUES
  (uuid_generate_v4(), 'PC Norte — Río Carapo', 'PUESTO_CONTROL', 12, true),
  (uuid_generate_v4(), 'PC Sur — Km 45 Guasipati', 'PUESTO_CONTROL', 8, true),
  (uuid_generate_v4(), 'PC Este — Frontera El Dorado', 'PUESTO_CONTROL', 10, true),
  (uuid_generate_v4(), 'PC Oeste — Puerto Ordaz', 'PUESTO_CONTROL', 6, true),
  (uuid_generate_v4(), 'Patrulla Alpha', 'PATRULLA_MOVIL', 4, true),
  (uuid_generate_v4(), 'Patrulla Bravo', 'PATRULLA_MOVIL', 4, true),
  (uuid_generate_v4(), 'Patrulla Charlie', 'PATRULLA_MOVIL', 4, true),
  (uuid_generate_v4(), 'Patrulla Delta — Río Cuyuní', 'PATRULLA_MOVIL', 5, true),
  (uuid_generate_v4(), 'Destacamento Especial FANB', 'PATRULLA_MOVIL', 15, true),
  (uuid_generate_v4(), 'Unidad Fluvial Norte', 'PATRULLA_MOVIL', 6, true)
ON CONFLICT DO NOTHING;
