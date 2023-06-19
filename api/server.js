const fastify = require("fastify")({
  logger: true,
});
const { initializeDbFunctions } = require("../db/dbFunctions");
const {
  getPreferences,
  getRegions,
  deletePreferences,
  setRegion,
} = require("../handlers/preferencesHandler");
const { applySimpleMarkdown } = require("../utils/parser");
const regions = require("../data/regions");

fastify.get("/filtros", async (request, reply) => {
  const { response, error } = await getPreferences(request.query.username);
  if (response) {
    return response;
  }
  reply.status(500);
  reply.error(error);
});

fastify.get("/regiones", async (request, reply) => {
  const entries = {
    ...regions,
    ...(await getRegions(request.query.username)),
  };
  return Object.entries(entries).reduce(
    (phrase, current) =>
      phrase.concat(
        applySimpleMarkdown(current[0], "__") + ": " + current[1] + "\n\n"
      ),
    ""
  );
});

fastify.get("/filtroseliminar", async (request, reply) => {
  const { response, error } = await deletePreferences(request.query.username);
  if (response) {
    return response;
  }
  reply.status(500);
  reply.error(error);
});

// Run the server!
fastify.listen({ port: 3000 }, async (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server is now listening on ${address}`);
  await initializeDbFunctions();
});
