import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());

// Dynamic Route Auto-loader
// Engineers can just add a file in the `routes` directory (e.g., `profile.ts` or `profile.js`)
// and it will be automatically mounted to `/api/v1/profile`
const routesPath = path.join(__dirname, 'routes');
if (fs.existsSync(routesPath)) {
  fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      const routeName = file.split('.')[0];
      const routeModule = require(path.join(routesPath, file));
      const router = routeModule.default || routeModule;
      app.use(`/api/v1/${routeName}`, router);
    }
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

export default app;