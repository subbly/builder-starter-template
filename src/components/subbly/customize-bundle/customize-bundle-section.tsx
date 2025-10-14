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

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_328px] items-start lg:gap-10">
        <div className="grid grid-cols-1 gap-3">
          {bundle.quantitySelectors && (
            <QuantitySelectBlock
              options={bundle.quantitySelectors}
              value={form.quantity}
              onSelect={(quantity) => updateForm({
                quantity
              })}
            />
          )}

          {!autoMatchRuleset && (
            <SizeSelectBlock
              options={rulesetOptions}
              value={rulesetId}
              showSizeName={bundle.showRulesetName}
              onChange={(id) => {
                setRulesetId(id)
              }}
            />
          )}

          {bundle.preferences?.length > 0 && (
            <PreferenceSelectBlock
              options={preferenceOptions}
              value={preferences}
              onChange={(value) => updatePreferences(value)}
            />
          )}


          {selectionType.single_product || props.groupItemsByProduct ? (
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
          )}
        </div>

        <div className="grid gap-3">
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

          {!validation?.invalid && (
            <ReceiptBlock
              {...bundleReceipt}
              discountType={bundle.discountType}
            />
          )}

          <ConfirmBlock
            validationRule={validation}
            onSubmit={() => addToCart()}
          />
        </div>
      </div>
    </div>
  )
}