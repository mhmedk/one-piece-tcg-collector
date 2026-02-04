export interface SetType {
  set_id: string;
  set_name: string;
}

export interface CardType {
  inventory_price: number;
  market_price: number;
  card_name: string;
  set_name: string;
  card_text: string;
  set_id: string;
  rarity: string;
  card_set_id: string;
  card_color: string;
  card_type: string;
  life: string;
  card_cost: string;
  card_power: string;
  sub_types: string;
  counter_amount: number;
  attribute: string;
  date_scraped: string;
  card_image_id: string;
  card_image: string;
}
