import { CustomFieldConfig, LanguageCode } from '@vendure/core';

/**
 * Order custom fields：
 * - posSessionId: 关联班次 ID
 * - orderType: sale / refund / hold（用 string + validate 限制取值，Vendure 3.6.4 无 enum 类型）
 * - refundedOrderId: 退货单关联的原销售单 ID
 * - shiftId: 冗余 shift_id 便于按班次查询（与 posSessionId 等价但便于直接 SQL 查询）
 * - terminalCode: 下单终端编号快照
 * - aggregatePayStatus: 聚合码支付状态 pending/confirmed/settled/failed
 */
const ORDER_TYPE_VALUES = ['sale', 'refund', 'hold'] as const;
const AGGREGATE_PAY_STATUS_VALUES = ['pending', 'confirmed', 'settled', 'failed'] as const;

function validateEnum(values: readonly string[], field: string) {
  return (value: string) => {
    if (value != null && !values.includes(value)) {
      return `${field} 仅支持取值 ${values.join(' | ')}，实际收到 ${value}`;
    }
  };
}

export const orderCustomFields: CustomFieldConfig[] = [
  {
    name: 'posSessionId',
    type: 'int',
    nullable: true,
    public: false,
    label: [{ languageCode: LanguageCode.zh_Hans, value: '关联班次 ID' }],
  },
  {
    name: 'orderType',
    type: 'string',
    nullable: false,
    defaultValue: 'sale',
    public: false,
    validate: validateEnum(ORDER_TYPE_VALUES, 'orderType'),
    label: [{ languageCode: LanguageCode.zh_Hans, value: '订单类型(sale/refund/hold)' }],
  },
  {
    name: 'refundedOrderId',
    type: 'int',
    nullable: true,
    public: false,
    label: [{ languageCode: LanguageCode.zh_Hans, value: '退货单关联的原销售单 ID' }],
  },
  {
    name: 'shiftId',
    type: 'int',
    nullable: true,
    public: false,
    label: [{ languageCode: LanguageCode.zh_Hans, value: '冗余 shift_id' }],
  },
  {
    name: 'terminalCode',
    type: 'string',
    nullable: true,
    public: false,
    label: [{ languageCode: LanguageCode.zh_Hans, value: '下单终端编号快照' }],
  },
  {
    name: 'aggregatePayStatus',
    type: 'string',
    nullable: true,
    public: false,
    validate: validateEnum(AGGREGATE_PAY_STATUS_VALUES, 'aggregatePayStatus'),
    label: [{ languageCode: LanguageCode.zh_Hans, value: '聚合码支付状态' }],
  },
];
