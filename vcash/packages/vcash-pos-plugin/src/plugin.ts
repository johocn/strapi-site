import { VendurePlugin } from '@vendure/core';

@VendurePlugin({
  configuration: (config) => {
    return config;
  },
})
export class VcashPosPlugin {}
