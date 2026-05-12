const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const obsCount = await prisma.observacion.count();
  const inatCount = await prisma.inaturalistObservacion.count();
  console.log(`Drive observations: ${obsCount}`);
  console.log(`iNaturalist observations: ${inatCount}`);
  console.log(`Total: ${obsCount + inatCount}`);

  const groups = await prisma.$queryRaw`
    WITH grouped_observations AS (
      SELECT gt.nombre AS "nombre", 'drive'::text AS "source"
      FROM observaciones o
      JOIN especies e ON o.id_especie = e.id_especie
      JOIN grupo_taxonomico gt ON e.grupo_taxonomico = gt.id_grupo
      WHERE o.geom IS NOT NULL

      UNION ALL

      SELECT gt.nombre AS "nombre", 'inaturalist'::text AS "source"
      FROM inaturalist_observaciones i
      JOIN grupo_taxonomico gt ON i.id_grupo = gt.id_grupo
      WHERE i.geom IS NOT NULL
    )
    SELECT "nombre", COUNT(*) as count
    FROM grouped_observations
    GROUP BY "nombre"
    ORDER BY count DESC
  `;
  console.log("Groups from DB:");
  console.log(JSON.stringify(groups, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
