import { CardSet, CardSetType } from "@/types";

export const cardSets: Record<CardSetType, CardSet> = {
  fibonacci: {
    type: "fibonacci",
    label: "Fibonacci",
    values: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "?", "☕"],
  },
  tshirt: {
    type: "tshirt",
    label: "T-Shirt",
    values: ["XS", "S", "M", "L", "XL", "XXL", "?", "☕"],
  },
};
