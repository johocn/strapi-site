import { defineStore } from 'pinia';
import { gql } from '@apollo/client/core';
import { apolloClient } from '@/api/client';

export interface OrderLineCustomFields {
  originalPrice: number;
  discount: number;
  memberPriceApplied: boolean;
  isGift: boolean;
  note: string | null;
}

export interface OrderLine {
  id: string;
  productVariant: { id: string; sku: string; name: string };
  unitPrice: number;
  unitPriceWithTax: number;
  quantity: number;
  linePrice: number;
  linePriceWithTax: number;
  customFields: OrderLineCustomFields;
}

export interface Order {
  id: string;
  code: string;
  state: string;
  total: number;
  totalWithTax: number;
  lines: OrderLine[];
}

const POS_ACTIVE_ORDER = gql`
  query PosActiveOrder {
    posActiveOrder {
      id
      code
      state
      total
      totalWithTax
      lines {
        id
        productVariant {
          id
          sku
          name
        }
        unitPrice
        unitPriceWithTax
        quantity
        linePrice
        linePriceWithTax
        customFields {
          originalPrice
          discount
          memberPriceApplied
          isGift
          note
        }
      }
    }
  }
`;

const ADD_POS_ITEM = gql`
  mutation AddPosItem($productVariantId: ID!, $quantity: Int!) {
    addPosItem(input: { productVariantId: $productVariantId, quantity: $quantity }) {
      id
      code
      state
      total
      totalWithTax
      lines {
        id
        productVariant {
          id
          sku
          name
        }
        unitPrice
        unitPriceWithTax
        quantity
        linePrice
        linePriceWithTax
        customFields {
          originalPrice
          discount
          memberPriceApplied
          isGift
          note
        }
      }
    }
  }
`;

const UPDATE_POS_ITEM = gql`
  mutation UpdatePosItem($orderLineId: ID!, $quantity: Int!) {
    updatePosItem(input: { orderLineId: $orderLineId, quantity: $quantity }) {
      id
      code
      state
      total
      totalWithTax
      lines {
        id
        productVariant {
          id
          sku
          name
        }
        unitPrice
        unitPriceWithTax
        quantity
        linePrice
        linePriceWithTax
        customFields {
          originalPrice
          discount
          memberPriceApplied
          isGift
          note
        }
      }
    }
  }
`;

export const useCartStore = defineStore('cart', {
  state: () => ({
    order: null as Order | null,
    loading: false,
  }),
  getters: {
    lines: (state) => state.order?.lines ?? [],
    totalWithTax: (state) => state.order?.totalWithTax ?? 0,
    total: (state) => state.order?.total ?? 0,
    itemCount: (state) =>
      (state.order?.lines ?? []).reduce((sum, l) => sum + l.quantity, 0),
    isEmpty: (state) => !state.order || state.order.lines.length === 0,
  },
  actions: {
    async loadActiveOrder() {
      this.loading = true;
      try {
        const { data, errors } = await apolloClient.query({
          query: POS_ACTIVE_ORDER,
          fetchPolicy: 'network-only',
        });
        if (errors?.length && !data) throw new Error(errors[0].message);
        this.order = (data?.posActiveOrder ?? null) as Order | null;
      } finally {
        this.loading = false;
      }
    },
    async addItem(productVariantId: string, quantity: number) {
      this.loading = true;
      try {
        const { data, errors } = await apolloClient.mutate({
          mutation: ADD_POS_ITEM,
          variables: { productVariantId, quantity },
        });
        if (errors?.length) throw new Error(errors[0].message);
        this.order = (data?.addPosItem ?? null) as Order | null;
      } finally {
        this.loading = false;
      }
    },
    async updateItem(orderLineId: string, quantity: number) {
      this.loading = true;
      try {
        const { data, errors } = await apolloClient.mutate({
          mutation: UPDATE_POS_ITEM,
          variables: { orderLineId, quantity },
        });
        if (errors?.length) throw new Error(errors[0].message);
        this.order = (data?.updatePosItem ?? null) as Order | null;
      } finally {
        this.loading = false;
      }
    },
    clear() {
      this.order = null;
    },
  },
});
