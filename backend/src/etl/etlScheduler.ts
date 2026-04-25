import cron, { type ScheduledTask } from "node-cron";
import { runDriveIngestion, runINaturalistIngestion } from "./etlService";

const color = {
  reset: "\x1b[0m",
  dim: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const now = () => new Date().toISOString();

class ETLScheduler {
  private tasks: ScheduledTask[] = [];
  private running = new Set<string>();

  private async runWithLock(name: string, task: () => Promise<unknown>): Promise<void> {
    if (this.running.has(name)) {
      console.log(
        `${color.dim}[${now()}]${color.reset} ${color.yellow}ETL_SKIP${color.reset} ${name} ya esta en ejecucion`,
      );
      return;
    }

    this.running.add(name);
    console.log(
      `${color.dim}[${now()}]${color.reset} ${color.cyan}ETL_START${color.reset} ${name}`,
    );

    try {
      await task();
      console.log(
        `${color.dim}[${now()}]${color.reset} ${color.green}ETL_OK${color.reset} ${name}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error(
        `${color.dim}[${now()}]${color.reset} ${color.red}ETL_FAIL${color.reset} ${name} ${message}`,
      );
    } finally {
      this.running.delete(name);
    }
  }

  start(): void {
    const timezone = process.env.ETL_TIMEZONE ?? "America/Bogota";

    const driveEnabled = (process.env.DRIVE_ETL_ENABLED ?? "true") === "true";
    const inatEnabled = (process.env.INAT_ETL_ENABLED ?? "true") === "true";
    const runOnStart = (process.env.ETL_RUN_ON_START ?? "true") === "true";

    if (driveEnabled) {
      const driveCron = process.env.DRIVE_ETL_CRON ?? "*/30 * * * *";
      const task = cron.schedule(
        driveCron,
        () => {
          void this.runWithLock("drive", runDriveIngestion);
        },
        { timezone },
      );
      this.tasks.push(task);
      console.log(
        `${color.dim}[${now()}]${color.reset} ${color.cyan}ETL_SCHEDULE${color.reset} drive cron='${driveCron}' tz='${timezone}'`,
      );

      if (runOnStart) {
        void this.runWithLock("drive", runDriveIngestion);
      }
    }

    if (inatEnabled) {
      const inatCron = process.env.INAT_ETL_CRON ?? "15 * * * *";
      const task = cron.schedule(
        inatCron,
        () => {
          void this.runWithLock("inaturalist", runINaturalistIngestion);
        },
        { timezone },
      );
      this.tasks.push(task);
      console.log(
        `${color.dim}[${now()}]${color.reset} ${color.cyan}ETL_SCHEDULE${color.reset} inaturalist cron='${inatCron}' tz='${timezone}'`,
      );

      if (runOnStart) {
        void this.runWithLock("inaturalist", runINaturalistIngestion);
      }
    }
  }

  stop(): void {
    for (const task of this.tasks) {
      void task.stop();
      void task.destroy();
    }

    this.tasks = [];
    console.log(
      `${color.dim}[${now()}]${color.reset} ${color.yellow}ETL_STOP${color.reset} scheduler detenido`,
    );
  }
}

export const createEtlScheduler = (): ETLScheduler => new ETLScheduler();
