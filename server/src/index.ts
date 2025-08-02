
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  jsonProcessInputSchema, 
  fileUploadInputSchema 
} from './schema';
import { processJson } from './handlers/process_json';
import { validateJson } from './handlers/validate_json';
import { processFileUpload } from './handlers/process_file_upload';
import { getJsonHistory } from './handlers/get_json_history';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  processJson: publicProcedure
    .input(jsonProcessInputSchema)
    .mutation(({ input }) => processJson(input)),
    
  validateJson: publicProcedure
    .input(z.string())
    .query(({ input }) => validateJson(input)),
    
  processFileUpload: publicProcedure
    .input(fileUploadInputSchema)
    .mutation(({ input }) => processFileUpload(input)),
    
  getJsonHistory: publicProcedure
    .query(() => getJsonHistory()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
