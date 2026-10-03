export interface SponsorshipData {
  auto_renew?: boolean;
  sponsor_name: string;
  base_value: number;
  remaining_weeks: number;
  bonus_criteria: unknown[];
}
