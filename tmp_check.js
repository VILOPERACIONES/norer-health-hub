import { PrismaClient } from '/Users/macbookeliam/Vilostudio/poryectos/norder-crm-api/node_modules/@prisma/client/index.js';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_D8MfAGke3jOH@ep-young-haze-ai1zo0si-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
    }
  }
});

async function main() {
    console.log("Checking valuation...");
    const val = await prisma.valoracion.findUnique({
        where: { id: '40df480c-9556-4f57-9e51-da4174a59286' },
        select: { suplementosDetalle: true, paciente: { select: { nombre: true, apellido: true } } }
    });
    console.log("Result:", JSON.stringify(val, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
