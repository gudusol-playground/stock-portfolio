"use client";

import { useState, useEffect, useRef } from "react";

// [ticker, name, exchange]
type KRStock = [string, string, string];
// [ticker, nameKo, nameEn, exchange]
type USStock = [string, string, string, string];

export interface StockResult {
  ticker: string;
  name: string;
  exchange: string;
}

const cache: { KR?: KRStock[]; US?: USStock[] } = {};

async function loadStocks(market: "KR" | "US") {
  if (cache[market]) return cache[market]!;
  const res = await fetch(market === "KR" ? "/kr-stocks.json" : "/us-stocks.json");
  const data = await res.json();
  cache[market] = data;
  return data as KRStock[] | USStock[];
}

/** 연관도 점수: 높을수록 우선 */
function score(ticker: string, name: string, q: string): number {
  if (ticker === q) return 4;
  if (ticker.startsWith(q)) return 3;
  if (name.startsWith(q)) return 2;
  return 1;
}

export function useStockSearch(market: "KR" | "US") {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dataRef = useRef<KRStock[] | USStock[] | null>(null);

  useEffect(() => {
    setIsLoading(true);
    loadStocks(market).then((data) => {
      dataRef.current = data as KRStock[] | USStock[];
      setIsLoading(false);
    });
  }, [market]);

  useEffect(() => {
    if (!query.trim() || !dataRef.current) {
      setResults([]);
      return;
    }

    const q = query.trim().toLowerCase();
    const matched: (StockResult & { score: number })[] = [];

    if (market === "KR") {
      for (const [ticker, name, exchange] of dataRef.current as KRStock[]) {
        const tl = ticker.toLowerCase();
        const nl = name.toLowerCase();
        if (tl.startsWith(q) || nl.includes(q)) {
          matched.push({ ticker, name, exchange, score: score(tl, nl, q) });
        }
      }
    } else {
      const qUpper = q.toUpperCase();
      for (const [ticker, nameKo, nameEn, exchange] of dataRef.current as USStock[]) {
        const nl = nameKo.toLowerCase();
        const nlEn = nameEn.toLowerCase();
        if (ticker.startsWith(qUpper) || nl.includes(q) || nlEn.includes(q)) {
          matched.push({
            ticker,
            name: nameKo || nameEn,
            exchange,
            score: score(ticker.toLowerCase(), nl, q),
          });
        }
      }
    }

    matched.sort((a, b) => b.score - a.score);
    setResults(matched.map(({ score: _, ...r }) => r));
  }, [query, market]);

  return { query, setQuery, results, isLoading };
}
