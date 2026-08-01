import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { UserInputError } from '@vendure/core';
import { Connection, Like } from 'typeorm';

import { PosSession, ShiftSummary } from '../entities/pos-session.entity';
import { PosTerminalService } from './pos-terminal.service';

/**
 * 班次生命周期服务：
 * - 开班：校验终端 active + 无 open session → 生成 session code → 持久化
 * - 关班：校验 session open → 标记 closed + 写入 closeSummary（可选）
 * - 查询：findOpenSession / findMySession / findOne
 *
 * 注意：closeSummary 由 ShiftReportService 在 Task 6 生成；当前 closeSession 接受外部传入，
 * 若未传则置 null，等 Task 6 接入。
 */
@Injectable()
export class PosSessionService {
  constructor(
    @InjectConnection() private connection: Connection,
    @Inject(PosTerminalService) private terminalService: PosTerminalService,
  ) {}

  /**
   * 开班。同一终端同时仅允许一个 open 状态 session。
   */
  async openSession(input: {
    terminalCode: string;
    operatorId: number;
    openingFloat?: number;
  }): Promise<PosSession> {
    const terminal = await this.terminalService.findByCode(input.terminalCode);
    if (!terminal) {
      throw new UserInputError(`终端 ${input.terminalCode} 不存在`);
    }
    if (!terminal.active) {
      throw new UserInputError(`终端 ${input.terminalCode} 已停用`);
    }

    const existing = await this.findOpenSession(terminal.id);
    if (existing) {
      throw new UserInputError(
        `终端 ${input.terminalCode} 已有开着的班次 ${existing.code}`,
      );
    }

    const code = await this.generateSessionCode();

    const session = new PosSession();
    session.code = code;
    session.terminal = terminal;
    session.stockLocation = terminal.stockLocation;
    session.operator = { id: input.operatorId } as any;
    session.state = 'open';
    session.openingFloat = input.openingFloat ?? 0;
    session.activeOrderId = null;

    const saved = await this.connection.getRepository(PosSession).save(session);
    const reloaded = await this.findOne(saved.id);
    if (!reloaded) {
      throw new Error(`班次 ${saved.id} 创建后查询失败`);
    }
    return reloaded;
  }

  /**
   * 关班。可选传入 closeSummary（Task 6 起 ShiftReportService 生成）。
   */
  async closeSession(input: {
    sessionId: number;
    closingCash?: number;
    approverId?: number;
    closeSummary?: ShiftSummary | null;
  }): Promise<PosSession> {
    const session = await this.findOne(input.sessionId);
    if (!session) {
      throw new UserInputError(`班次 ${input.sessionId} 不存在`);
    }
    if (session.state !== 'open') {
      throw new UserInputError(`班次 ${session.code} 已关闭`);
    }

    session.state = 'closed';
    session.closedAt = new Date();
    session.closingCash = input.closingCash ?? 0;
    session.closeSummary = input.closeSummary ?? null;
    if (input.approverId) {
      session.approver = { id: input.approverId } as any;
    }
    session.activeOrderId = null;

    return this.connection.getRepository(PosSession).save(session);
  }

  async findOpenSession(terminalId: number): Promise<PosSession | null> {
    return this.connection.getRepository(PosSession).findOne({
      where: { terminal: { id: terminalId }, state: 'open' },
      relations: ['terminal', 'operator', 'stockLocation'],
    });
  }

  async findMyOpenSession(operatorId: number): Promise<PosSession | null> {
    return this.connection.getRepository(PosSession).findOne({
      where: { operator: { id: operatorId }, state: 'open' },
      relations: ['terminal', 'operator', 'stockLocation'],
    });
  }

  async findOne(id: number): Promise<PosSession | null> {
    return this.connection.getRepository(PosSession).findOne({
      where: { id },
      relations: ['terminal', 'operator', 'approver', 'stockLocation'],
    });
  }

  /**
   * 生成班次号：S{YYYYMMDD}-{3位序号}。序号按当天已有 session 数 +1 推算。
   */
  private async generateSessionCode(): Promise<string> {
    const dateStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const prefix = `S${dateStr}-`;
    const count = await this.connection
      .getRepository(PosSession)
      .count({ where: { code: Like(`${prefix}%`) } });
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
}
