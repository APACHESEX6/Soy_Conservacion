import dotenv from "dotenv";
import { disconnectDatabase } from "../config/database";
import { runAllIngestions } from "./etlService";

dotenv.config();

const main = async (): Promise<void> => {
  const summaries = await runAllIngestions();
  console.log("ETL manual finalizado", summaries);
};

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`ETL manual fallo: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
