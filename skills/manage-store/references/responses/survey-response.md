# Survey Response

Return type for `surveys.get` (`Survey`).

```ts
interface Survey {
  id: number;
  title: string;
  questions: SurveyQuestion[];
  singleStep: boolean;
  multiplyPriceByShipmentNumber: boolean;
  appearanceType?: 'normal' | 'special' | null;
  createdAt: string;
  updatedAt: string;
}

interface SurveyQuestion {
  id: number;
  type: 'text' | 'select' | 'multiple' | 'quantity';
  title: string;
  description?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  minCount?: number | null;
  maxCount?: number | null;
  required: boolean;
  position: number;
  answers: SurveyAnswer[];
  createdAt: string;
  updatedAt?: string;
}

interface SurveyAnswer {
  id: number;
  content?: string | null;
  price: number;
  imageUrl?: string | null;
  stockCount?: number | null;
  position: number;
  default: boolean;
  defaultQuantity?: number | null;
  createdAt: string;
  updatedAt?: string;
}
```
