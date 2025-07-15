import { Bundle } from "@/lib/subbly/types";
import { BundleForm, PlanPriceCalculatorMap, PriceCalculateFn } from "@/types";
import { useMemo } from "react";


type UseBundlePriceProps = {
  bundle: Bundle
  form: BundleForm
}

const calcOriginalPriceFn = (price: number) => price;

const makeDiscountCalculateFn = (amountOff: number | null, percentOff: number | null): PriceCalculateFn => {
  if (amountOff) {
    return (price: number): number => {
      return Math.max(Math.round(price - amountOff), 0);
    };
  } else if (percentOff) {
    return (price: number): number => {
      return price * (1 - Math.min(percentOff, 100) / 100);
    };
  }

  return calcOriginalPriceFn;
};

export const useBundlePrice = (props: UseBundlePriceProps) => {
  const subtotal = useMemo(() => {
    const itemsSubtotal = Object.values(props.form.items).reduce((acc, selectedItem) => {
      return acc + selectedItem.item.variant.price * selectedItem.quantity;
    }, 0);

    return Math.round(itemsSubtotal * props.form.quantity);
  }, [props.form.items, props.form.quantity]);

  const planPriceCalculatorMap = useMemo<PlanPriceCalculatorMap>(() => {
    const { discountType } = props.bundle;
    const discountable = !discountType || discountType === "total" || discountType === "percentage";

    if (!discountable) {
      return new Map([]);
    }

    return props.bundle.plans.reduce<PlanPriceCalculatorMap>((acc, plan) => {
      const productId = plan.plan?.id
      const discount = plan.discounts[0]

      if (!productId || !discount) {
        return acc;
      }

      const range = discount.ranges[0];

      acc.set(productId, makeDiscountCalculateFn(range.amountOff, range.percentOff));

      return acc;
    }, new Map([]));
  }, [props.bundle]);

  return {
    subtotal,
    planPriceCalculatorMap,
  };
};