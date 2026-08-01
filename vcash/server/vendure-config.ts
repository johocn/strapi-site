import { DefaultLogger, LogLevel, VendureConfig } from '@vendure/core';
import { CjkPlugin } from '@vendure/cjk-plugin';
import { MemberLevelPlugin } from '@vendure/member-level-plugin';
import { VcashPosPlugin } from '@vcash/pos-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import path from 'node:path';

export const config: VendureConfig = {
  apiOptions: {
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    port: 3000,
    hostname: '0.0.0.0',
    cors: {
      origin: true,
      credentials: true,
    },
  },
  authOptions: {
    tokenMethod: 'bearer',
    requireVerification: false,
    cookieOptions: {
      sameSite: 'lax',
    },
  },
  dbConnectionOptions: {
    type: 'better-sqlite3',
    database: path.join(__dirname, 'sqlite.db'),
    synchronize: true,
    logging: false,
  },
  paymentOptions: {
    paymentMethodHandlers: [],
  },
  logger: new DefaultLogger({ level: LogLevel.Info }),
  plugins: [
    CjkPlugin.init({}),
    MemberLevelPlugin.init({}),
    VcashPosPlugin,
    AssetServerPlugin.init({
      assetUploadDir: path.join(__dirname, 'assets'),
      route: 'assets',
    }),
    EmailPlugin.init({
      handlers: defaultEmailHandlers,
      templateLoader: new FileBasedTemplateLoader(path.join(__dirname, 'email-templates')),
      transport: {
        type: 'file',
        outputPath: path.join(__dirname, 'email-output'),
      },
    }),
  ],
};
