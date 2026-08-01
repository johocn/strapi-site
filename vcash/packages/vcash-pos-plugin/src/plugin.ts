import { TypeOrmModule } from '@nestjs/typeorm';
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';

import { posSessionPermission, posTerminalPermission } from './constants';
import { PosSession } from './entities/pos-session.entity';
import { PosTerminal } from './entities/pos-terminal.entity';
import { AdminPosResolver } from './resolvers/admin-pos.resolver';
import { AdminTerminalResolver } from './resolvers/admin-terminal.resolver';
import { PosSessionService } from './services/pos-session.service';
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

  type PosSession {
    id: ID!
    code: String!
    terminal: PosTerminal!
    stockLocation: StockLocation!
    operator: Administrator!
    approver: Administrator
    state: String!
    openedAt: DateTime!
    closedAt: DateTime
    closeSummary: JSON
    openingFloat: Int!
    closingCash: Int!
    activeOrderId: Int
    updatedAt: DateTime!
  }

  input OpenSessionInput {
    terminalCode: String!
    openingFloat: Int
  }

  input CloseSessionInput {
    sessionId: ID!
    closingCash: Int
    approverId: ID
  }

  type CloseSessionResult {
    session: PosSession!
    summary: JSON
  }

  extend type Query {
    myPosSession: PosSession
    posSession(id: ID!): PosSession
  }

  extend type Mutation {
    openSession(input: OpenSessionInput!): PosSession!
    closeSession(input: CloseSessionInput!): CloseSessionResult!
  }
`;

@VendurePlugin({
  imports: [
    PluginCommonModule,
    TypeOrmModule.forFeature([PosTerminal, PosSession]),
  ],
  entities: [PosTerminal, PosSession],
  providers: [PosTerminalService, PosSessionService],
  adminApiExtensions: {
    resolvers: [AdminTerminalResolver, AdminPosResolver],
    schema: adminSchema,
  },
  configuration: (config) => {
    // 注册 PosTerminal + PosSession CRUD 自定义权限定义（superadmin 自动放行，其他角色需显式授予）
    config.authOptions.customPermissions = [
      ...(config.authOptions.customPermissions ?? []),
      posTerminalPermission,
      posSessionPermission,
    ];
    return config;
  },
})
export class VcashPosPlugin {}
