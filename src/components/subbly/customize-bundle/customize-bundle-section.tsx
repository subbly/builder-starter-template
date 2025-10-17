'use client'

import { useBundleForm, useBundleReceipt, useBundleValidation } from '@subbly/react'
import type { Bundle } from '@subbly/react'
import { QuantitySelectBlock } from './quantity-select-block'
import { SizeSelectBlock } from './size-select-block'
import { PreferenceSelectBlock } from './preference-select-block'
import { ProductGroupedItemSelectBlock } from './product-grouped-item-select-block'
import { ItemSelectBlock } from './item-select-block'
import { ReceiptBlock } from './receipt-block'
import { ConfirmBlock } from './confirm-block'
import { PlanSelector } from './plan-selector'
import { SelectedItemBlock } from './selected-item-block'
import { SelectionProgress } from './selection-progress'
import { useBundleQuoteQuery } from '@/lib/subbly/queries/use-bundle-quote-query'
import { OneStepLayout } from './layouts/one-step-layout'
import { TwoStepLayout } from './layouts/two-step-layout'
import type { BundleLayoutProps } from './layouts/layout-props'

type CustomizeBundleProps = {
  bundle: Bundle
  groupItemsByProduct?: boolean
  allowMultipleItemsInGroup?: boolean
}

export const CustomizeBundleSection = (props: CustomizeBundleProps) => {
  const { bundle } = props

  const {
    form,
    updateForm,
    rulesetOptions,
    rulesetId,
    setRulesetId,
    autoMatchRuleset,
    selectionType,
    preferenceOptions,
    preferences,
    updatePreferences,
    planOptions,
    planPriceCalculatorMap,
    itemsPrice,
    rulesetSelectionProgress,
    rulesetStepsPriceBreakdown,
    hideItemQuantity,
    hidePlanPrice,
    hidePlanBasePrice,
    itemsQuantityChangeDisabled,
    calculateItemPrice,
    selectedRuleset,
    appearanceType,
    addToCart,
  } = useBundleForm({
    bundle
  })

  const { data: bundleQuote } = useBundleQuoteQuery({
    bundleId: bundle.id,
    payload: {
      productId: form.productId,
      quantity: form.quantity,
      items: form.items.map((item) => ({
        productId: item.item.productId,
        quantity: item.quantity
      })),
      preferences: form.preferences || []
    }
  })

  const bundleReceipt = useBundleReceipt({
    bundle,
    form,
    rulesetId,
    quote: bundleQuote
  })

  const { validation, rules } = useBundleValidation({
    bundle,
    form,
    ruleset: selectedRuleset
  })

  const addItemsDisabled = !autoMatchRuleset && !!rules.itemsMax.expected && rules.itemsMax.delta >= 0
  const isTwoColumnLayout = appearanceType.two_step || appearanceType.after_checkout

  const quantitySelectBlock = bundle.quantitySelectors ? (
    <QuantitySelectBlock
      options={bundle.quantitySelectors}
      value={form.quantity}
      onSelect={(quantity) => updateForm({
        quantity
      })}
      className={isTwoColumnLayout && 'xl:grid-cols-1 xl:gap-3'}
    />
  ) : null
  const sizeSelectBlock = !autoMatchRuleset ? (
    <SizeSelectBlock
      options={rulesetOptions}
      value={rulesetId}
      showSizeName={bundle.showRulesetName}
      onChange={(id) => {
        setRulesetId(id)
      }}
      className={isTwoColumnLayout && 'xl:grid-cols-1 xl:gap-3'}
    />
  ) : null

  const preferencesBlock = bundle.preferences?.length > 0 ? (
    <PreferenceSelectBlock
      options={preferenceOptions}
      value={preferences}
      onChange={(value) => updatePreferences(value)}
      className={isTwoColumnLayout && 'xl:grid-cols-1 xl:gap-3'}
    />
  ) : null

  const itemSelectBlock = selectionType.single_product || props.groupItemsByProduct ? (
    <ProductGroupedItemSelectBlock
      bundle={bundle}
      selectedItems={form.items}
      calculateItemPrice={calculateItemPrice}
      hideItemQuantity={hideItemQuantity}
      allowMultipleItemsInGroup={props.allowMultipleItemsInGroup}
      addItemsDisabled={addItemsDisabled}
      onItemsChange={(items) => updateForm({
        items
      })}
    />
  ) : (
    <ItemSelectBlock
      bundle={bundle}
      selectedItems={form.items}
      calculateItemPrice={calculateItemPrice}
      addItemsDisabled={addItemsDisabled}
      onItemsChange={(items) => updateForm({
        items
      })}
    />
  )

  const planSelectBlock = (
    <div className="bg-background p-4 rounded-xl">
      <PlanSelector
        options={planOptions}
        value={form.productId}
        hidePlanPrice={hidePlanPrice}
        hideBasePrice={hidePlanBasePrice}
        priceCalculatorMap={planPriceCalculatorMap}
        subtotal={itemsPrice}
        onSelect={(planId) => updateForm({
          productId: planId
        })}
      />
    </div>
  )

  const selectedItemsBlock = (
    <div className="bg-background p-4 rounded-xl">
      {form.items.length > 0 ? (
        <>
          <SelectedItemBlock
            bundle={bundle}
            selectedItems={form.items}
            quantityChangeDisabled={itemsQuantityChangeDisabled}
            calculateItemPrice={calculateItemPrice}
            hideItemQuantity={hideItemQuantity}
            addDisabled={addItemsDisabled}
            onItemsChange={(items) => updateForm({
              items
            })}
          />

          {autoMatchRuleset && rulesetStepsPriceBreakdown.next && (
            <SelectionProgress
              priceBreakdown={rulesetStepsPriceBreakdown.next}
              progress={rulesetSelectionProgress}
            />
          )}
        </>
      ) : (
        <>
          Your selection is currently empty.
        </>
      )}
    </div>
  )

  const receiptBlock = !validation?.invalid ? (
    <ReceiptBlock
      {...bundleReceipt}
      discountType={bundle.discountType}
    />
  ) : null

  const confirmBlock = (
    <ConfirmBlock
      validationRule={appearanceType.after_checkout ? null : validation}
      onSubmit={() => addToCart()}
    />
  )

  const sharedLayoutProps: BundleLayoutProps = {
    quantitySelectBlock,
    sizeSelectBlock,
    preferencesBlock,
    itemSelectBlock,
    planSelectBlock,
    selectedItemsBlock,
    receiptBlock,
    confirmBlock
  }

  return (
    <div className="container mx-auto">
      {appearanceType.two_step || appearanceType.after_checkout ? (
        <TwoStepLayout
          {...sharedLayoutProps}
          skipItems={appearanceType.after_checkout}
        />
      ) : (
        <OneStepLayout
          {...sharedLayoutProps}
        />
      )}
    </div>
  )
}