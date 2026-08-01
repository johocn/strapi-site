import { bootstrap } from '@vendure/core';
import { config } from './vendure-config';

bootstrap(config).catch((err) => {
  console.error('Vendure 启动失败:', err);
  process.exit(1);
});
