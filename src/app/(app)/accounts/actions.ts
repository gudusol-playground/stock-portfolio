"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── 계좌 ──────────────────────────────────────────

export async function addAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    broker: formData.get("broker") as string,
  });

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function updateAccount(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("accounts")
    .update({
      name: formData.get("name") as string,
      broker: formData.get("broker") as string,
    })
    .eq("id", formData.get("id") as string);

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/");
}

// ── 보유 종목 ──────────────────────────────────────

export async function addHolding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const market = formData.get("market") as string;

  const { error } = await supabase.from("holdings").insert({
    user_id: user.id,
    account_id: formData.get("account_id") as string,
    ticker: (formData.get("ticker") as string).toUpperCase(),
    name: formData.get("name") as string,
    market,
    quantity: Number(formData.get("quantity")),
    avg_price: Number(formData.get("avg_price")),
    currency: market === "US" ? "USD" : "KRW",
  });

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function updateHolding(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("holdings")
    .update({
      quantity: Number(formData.get("quantity")),
      avg_price: Number(formData.get("avg_price")),
    })
    .eq("id", formData.get("id") as string);

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function deleteHolding(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("holdings").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/");
}

// ── 코인 보유 ──────────────────────────────────────

export async function addCoinHolding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase.from("coin_holdings").insert({
    user_id: user.id,
    exchange: formData.get("exchange") as string,
    ticker: (formData.get("ticker") as string).toUpperCase(),
    name: formData.get("name") as string,
    quantity: Number(formData.get("quantity")),
    avg_price: Number(formData.get("avg_price")),
  });

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function updateCoinHolding(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("coin_holdings")
    .update({
      exchange: formData.get("exchange") as string,
      quantity: Number(formData.get("quantity")),
      avg_price: Number(formData.get("avg_price")),
    })
    .eq("id", formData.get("id") as string);

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function deleteCoinHolding(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("coin_holdings").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/");
}
