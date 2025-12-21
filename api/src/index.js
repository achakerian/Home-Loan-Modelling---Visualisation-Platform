import Fastify from 'fastify';

const app = Fastify({ logger: false });

app.get('/healthz', async () => ({ status: 'ok' }));

const port = process.env.PORT || 3000;

app.listen({ port, host: '0.0.0.0' }).then(() => {
  console.log(`API listening on ${port}`);
});
