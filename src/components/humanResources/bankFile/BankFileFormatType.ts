export interface BankFileFormatOption {
  code: string;
  label: string;
}

export interface BankFileFormatSettingField {
  key: string;
  label: string;
  required: boolean;
  default?: string;
}

export interface BankFileFormatDetail {
  code: string;
  label: string;
  fields: BankFileFormatSettingField[];
  settings: Record<string, string>;
}
