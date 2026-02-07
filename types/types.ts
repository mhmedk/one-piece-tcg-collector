export interface SetType {
  id: string;
  label: string | null;
  name: string;
  prefix: string | null;
}

export interface CardType {
  id: string;
  pack_id: string;
  name: string;
  rarity: string;
  category: string;
  colors: string[];
  cost: number | null;
  power: number | null;
  counter: number | null;
  life: number | null;
  attributes: string[];
  types: string[];
  effect: string | null;
  trigger_text: string | null;
  img_url: string;
  block_number: number | null;
}
