import { SubscriptionRepository } from "../repositories/subscriptionRepository";
import { Subscription } from "../models";

const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: 'Standard',
  status: 'trial',
  trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  price: "₨ 5,000"
};

const PLAN_PRICING = {
  Starter: "₨ 2,500",
  Standard: "₨ 5,000",
  Pro: "₨ 10,000",
  Enterprise: "₨ 25,000"
};

export class SubscriptionService {
  static async getSubscription(tenantId: string): Promise<Subscription> {
    const s = await SubscriptionRepository.get(tenantId);
    if (!s) {
      return await SubscriptionRepository.save(tenantId, DEFAULT_SUBSCRIPTION);
    }
    return s;
  }

  static async changePlan(tenantId: string, plan: 'Starter' | 'Standard' | 'Pro' | 'Enterprise'): Promise<Subscription> {
    const existing = await this.getSubscription(tenantId);
    const updated: Subscription = {
      plan,
      status: 'active',
      trialEndsAt: existing.trialEndsAt,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      price: PLAN_PRICING[plan] || "₨ 0"
    };
    return await SubscriptionRepository.save(tenantId, updated);
  }

  static async resetTrial(tenantId: string): Promise<Subscription> {
    const updated: Subscription = {
      plan: 'Starter',
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      price: "₨ 2,500"
    };
    return await SubscriptionRepository.save(tenantId, updated);
  }
}
