import { CustomerRepository } from "../repositories/customerRepository";
import { Customer, CustomerLedgerEntry } from "../models";

export class CustomerService {
  static async listCustomers(tenantId: string): Promise<Customer[]> {
    return await CustomerRepository.getAll(tenantId);
  }

  static async getLedger(tenantId: string): Promise<CustomerLedgerEntry[]> {
    return await CustomerRepository.getLedger(tenantId);
  }

  static async createCustomer(tenantId: string, data: Omit<Customer, 'id' | 'outstandingBalance'>): Promise<Customer> {
    const id = `cust-${Date.now()}`;
    const customer: Customer = {
      ...data,
      id,
      outstandingBalance: 0,
      creditLimit: Number(data.creditLimit) || 0
    };
    return await CustomerRepository.save(tenantId, customer);
  }

  static async updateCustomer(tenantId: string, id: string, updates: Partial<Customer>): Promise<Customer> {
    const existing = await CustomerRepository.getById(tenantId, id);
    if (!existing) throw new Error("Customer not found");

    const updated: Customer = {
      ...existing,
      ...updates,
      creditLimit: updates.creditLimit !== undefined ? Number(updates.creditLimit) : existing.creditLimit,
      outstandingBalance: updates.outstandingBalance !== undefined ? Number(updates.outstandingBalance) : existing.outstandingBalance
    };
    return await CustomerRepository.save(tenantId, updated);
  }

  static async receivePayment(tenantId: string, customerId: string, amount: number, reference: string): Promise<{ customer: Customer; ledgerEntry: CustomerLedgerEntry }> {
    const customer = await CustomerRepository.getById(tenantId, customerId);
    if (!customer) throw new Error("Customer not found");

    const amt = Number(amount) || 0;
    const newBalance = Math.max(0, customer.outstandingBalance - amt);
    customer.outstandingBalance = newBalance;
    const updatedCustomer = await CustomerRepository.save(tenantId, customer);

    const ledgerEntry: CustomerLedgerEntry = {
      id: `led-${Date.now()}`,
      customerId,
      date: new Date().toISOString(),
      type: "payment",
      amount: amt,
      balanceAfter: newBalance,
      description: `Payment received: ${reference}`
    };
    const savedEntry = await CustomerRepository.saveLedgerEntry(tenantId, ledgerEntry);

    return { customer: updatedCustomer, ledgerEntry: savedEntry };
  }
}
