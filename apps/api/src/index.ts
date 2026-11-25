import http from 'http';
import app from './app';
import { env } from './config/env';
import { initSocketIO } from './socket/socket';

const PORT = env.PORT;
const server = http.createServer(app);
initSocketIO(server);

server.listen(PORT, () => {
  console.log(`[API] Server + Socket.IO running on http://localhost:${PORT}`);
});

export { server };
