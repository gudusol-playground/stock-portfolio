import { createClient } from "./server";
import type { Account, Holding } from "@/types";

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getHoldings(): Promise<Holding[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("holdings")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
