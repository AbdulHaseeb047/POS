import { SettingsRepository } from "../repositories/settingsRepository";
import { BusinessSettings } from "../models";

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: "Karachi Super Mart",
  address: "Block 4, Gulshan-e-Iqbal, Karachi",
  phone: "021-34567890",
  currency: "₨",
  taxEnabled: true,
  taxRate: 6.5,
  taxLabel: "SRB/GST",
  receiptHeader: "WELCOME TO KARACHI SUPER MART\nYour One-Stop Shop for Quality Groceries",
  receiptFooter: "Thank you for shopping with us!\nSoftware Powered by ZapPOS (0300-ZAPPOS)",
  lowStockAlertEnabled: true
};

export class SettingsService {
  static async getSettings(tenantId: string): Promise<BusinessSettings> {
    const s = await SettingsRepository.get(tenantId);
    if (!s) {
      return await SettingsRepository.save(tenantId, DEFAULT_SETTINGS);
    }
    return s;
  }

  static async updateSettings(tenantId: string, updates: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const existing = await this.getSettings(tenantId);
    const updated = { ...existing, ...updates };
    return await SettingsRepository.save(tenantId, updated);
  }
}
