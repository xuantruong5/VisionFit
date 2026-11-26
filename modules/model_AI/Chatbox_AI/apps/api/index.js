import { config } from './config.js';
import { createApp } from './app.js';
const c = config();
const { server } = createApp(c);
server.listen(c.port, c.host, () => {
  console.info(`VisionFit Assistant: ${c.origin}\nData: ${c.dataMode} | AI: ${c.aiMode}`);
});
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(1), 10000).unref(); });
