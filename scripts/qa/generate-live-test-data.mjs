import { logJson, productionConfig } from "./qa-utils.mjs";
import { buildLiveTestData } from "./live-test-data.mjs";

async function main() {
  const { baseUrl } = productionConfig();
  const data = buildLiveTestData();

  logJson({
    ok: true,
    baseUrl,
    ...data,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
