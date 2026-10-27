// A live list (products, cars, dishes) takes the room its cards need, no more: with a single card the slide
// shrinks to it, with twenty it grows. An empty list keeps the height it was drawn with.
export const MIN_LIST_HEIGHT = 160;

export const fitMinHeight = (hasItems: boolean, box: number) => (hasItems ? Math.min(MIN_LIST_HEIGHT, box) : box);

// How much taller (or shorter, negative) than its box the cards are, never leaving less than MIN_LIST_HEIGHT.
export const fitExtra = (natural: number, box: number, hasItems: boolean) =>
  Math.ceil(hasItems ? Math.max(natural, Math.min(MIN_LIST_HEIGHT, box)) - box : Math.max(0, natural - box));
