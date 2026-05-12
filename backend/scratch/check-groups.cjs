const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const allGroups =
    await prisma.$queryRaw`SELECT gt.nombre, COUNT(*)::int as count FROM observaciones o JOIN especies e ON o.id_especie = e.id_especie JOIN grupo_taxonomico gt ON e.grupo_taxonomico = gt.id_grupo GROUP BY gt.nombre`;
  console.log("Drive Groups:", allGroups);

  const inatGroups =
    await prisma.$queryRaw`SELECT gt.nombre, COUNT(*)::int as count FROM inaturalist_observaciones i JOIN grupo_taxonomico gt ON i.id_grupo = gt.id_grupo GROUP BY gt.nombre`;
  console.log("iNat Groups:", inatGroups);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
