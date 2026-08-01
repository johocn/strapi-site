import { TypeOrmModule } from '@nestjs/typeorm';
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';

import { posTerminalPermission } from './constants';
import { PosTerminal } from './entities/pos-terminal.entity';
import { AdminTerminalResolver } from './resolvers/admin-terminal.resolver';
import { PosTerminalService } from './services/pos-terminal.service';

const adminSchema = gql`
  type PosTerminal {
    id: ID!
    code: String!
    name: String!
    channel: Channel!
    stockLocation: StockLocation!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    deviceConfig: JSON
  }

  input CreatePosTerminalInput {
    code: String!
    name: String!
    stockLocationId: ID!
    deviceConfig: JSON
  }

  input UpdatePosTerminalInput {
    id: ID!
    name: String
    stockLocationId: ID
    active: Boolean
    deviceConfig: JSON
  }

  extend type Query {
    posTerminals(channelId: ID): [PosTerminal!]!
    posTerminal(id: ID!): PosTerminal
  }

  extend type Mutation {
    createPosTerminal(input: CreatePosTerminalInput!): PosTerminal!
    updatePosTerminal(input: UpdatePosTerminalInput!): PosTerminal!
    deletePosTerminal(id: ID!): Boolean!
  }
`;

@VendurePlugin({
  imports: [PluginCommonModule, TypeOrmModule.forFeature([PosTerminal])],
  entities: [PosTerminal],
  providers: [PosTerminalService],
  adminApiExtensions: {
    resolvers: [AdminTerminalResolver],
    schema: adminSchema,
  },
  configuration: (config) => {
    // 注册 PosTerminal CRUD 自定义权限定义（superadmin 自动放行，其他角色需显式授予）
    config.authOptions.customPermissions = [
      ...(config.authOptions.customPermissions ?? []),
      posTerminalPermission,
    ];
    return config;
  },
})
export class VcashPosPlugin {}
