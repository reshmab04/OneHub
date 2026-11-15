import app from './app';
import { config } from './config/env';

app.listen(config.port, () => {
  console.log(`OneHub backend running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`GitHub token: ${config.github.token ? 'configured' : 'not set (rate-limited)'}`);
  console.log(`Supabase: ${config.supabase.url ? 'configured' : 'not set'}`);
});
