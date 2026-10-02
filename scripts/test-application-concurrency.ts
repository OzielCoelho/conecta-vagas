// Invoked only by test-migrations.mjs against its own disposable database.
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { prisma } from "../src/shared/prisma/prisma.client";
import { ApplicationRepository } from "../src/modules/applications/application.repository";

async function main() {
  assert.equal(process.env.CVAG_DISPOSABLE_TEST, "1", "Run through npm run test:migrations");
  const url = new URL(process.env.DATABASE_URL!);
  assert.ok(["/fresh", "/legacy"].includes(url.pathname));
  const observer = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });
  const repository = new ApplicationRepository();
  try {
    const student = await prisma.student.findFirstOrThrow({ where: { user: { email: "student@example.test" } } });
    const company = await prisma.company.findFirstOrThrow({ where: { user: { email: "company@example.test" } } });
    const job = await prisma.job.create({ data: { title: "Concorrência", description: "Teste", skills: ["SQL"], model: "REMOTE", companyId: company.id } });
    const data = { studentId: student.id, jobId: job.id };
    let closingAttempt: Promise<unknown> | undefined;
    await observer.$transaction(async transaction => {
      await transaction.job.update({ where: { id: job.id }, data: { isActive: false } });
      // The closing transaction holds the row lock. Candidate must wait for it.
      closingAttempt = repository.create(data).then(
        () => ({ statusCode: 201 }),
        error => error,
      );
      let waiting = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        // Observe from another connection to avoid a cached statistics snapshot.
        const rows = await observer.$queryRaw<{ waiting: boolean }[]>`
          SELECT EXISTS (
            SELECT 1 FROM pg_stat_activity
            WHERE datname = current_database()
              AND application_name = 'cvag005_candidate'
              AND wait_event_type = 'Lock'
              AND query LIKE '%FOR UPDATE%'
          ) AS waiting
        `;
        if (rows[0].waiting) { waiting = true; break; }
        await delay(20);
      }
      assert.ok(waiting, "Application creation must wait for the closing transaction");
    }, { timeout: 10000 });
    assert.equal((await closingAttempt as { statusCode: number }).statusCode, 409);
    assert.equal(await prisma.application.count({ where: { jobId: job.id } }), 0);

    await prisma.job.update({ where: { id: job.id }, data: { isActive: true } });
    const results = await Promise.allSettled([repository.create(data), repository.create(data)]);
    assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
    const rejected = results.find(result => result.status === "rejected");
    assert.ok(rejected && rejected.status === "rejected");
    assert.equal(rejected.reason.statusCode, 409);
    assert.equal(rejected.reason.message, "Você já se candidatou a esta vaga.");
    assert.equal(await prisma.application.count({ where: { jobId: job.id } }), 1);
    console.log("PASS concurrency: closing job blocks insertion; duplicate requests return conflict");
  } finally {
    await observer.$disconnect();
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
