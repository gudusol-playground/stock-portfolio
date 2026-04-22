import { getAccounts, getCoinHoldings, getHoldings } from "@/lib/supabase/queries";
import { formatKRW, formatNumber } from "@/lib/portfolio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus } from "lucide-react";
import { AccountDialog } from "./components/account-dialog";
import { HoldingDialog } from "./components/holding-dialog";
import { CoinHoldingDialog } from "./components/coin-holding-dialog";
import { DeleteButton } from "./components/delete-button";
import { deleteAccount, deleteCoinHolding, deleteHolding } from "./actions";

export default async function AccountsPage() {
  const [accounts, holdings, coinHoldings] = await Promise.all([
    getAccounts(),
    getHoldings(),
    getCoinHoldings(),
  ]);

  const brokerGroups = Array.from(
    accounts.reduce((map, account) => {
      const group = map.get(account.broker) ?? [];
      map.set(account.broker, [...group, account]);
      return map;
    }, new Map<string, typeof accounts>())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">계좌 관리</h1>
        <AccountDialog
          trigger={
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              계좌 추가
            </Button>
          }
        />
      </div>

      {accounts.length === 0 && (
        <p className="text-sm text-muted-foreground">계좌를 추가해주세요.</p>
      )}

      <div className="space-y-8">
        {brokerGroups.map(([broker, brokerAccounts]) => (
          <div key={broker} className="space-y-3">
            <h2 className="border-l-2 border-primary pl-3 text-sm font-semibold">{broker}</h2>
            <div className="space-y-4">
              {brokerAccounts.map((account) => {
                const accountHoldings = holdings.filter((h) => h.account_id === account.id);

                return (
                  <Card key={account.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{account.name}</CardTitle>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline">{accountHoldings.length}개 종목</Badge>
                          <HoldingDialog
                            accountId={account.id}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="종목 추가">
                                <Plus className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <AccountDialog
                            account={account}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="계좌 수정">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DeleteButton
                            description={`"${account.name}" 계좌와 보유 종목 ${accountHoldings.length}개가 모두 삭제됩니다.`}
                            onDelete={async () => {
                              "use server";
                              return deleteAccount(account.id);
                            }}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {accountHoldings.length === 0 ? (
                        <p className="px-6 py-4 text-sm text-muted-foreground">
                          보유 종목이 없습니다.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>종목</TableHead>
                              <TableHead className="hidden text-right md:table-cell">수량</TableHead>
                              <TableHead className="hidden text-right md:table-cell">평균단가</TableHead>
                              <TableHead className="text-right">매입금액</TableHead>
                              <TableHead className="w-20" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {accountHoldings.map((h) => (
                              <TableRow key={h.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${h.market === "KR" ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300" : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}
                                    >
                                      {h.market}
                                    </Badge>
                                    <div>
                                      <p className="font-medium">{h.name}</p>
                                      <p className="text-xs text-muted-foreground">{h.ticker}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden text-right md:table-cell">
                                  {formatNumber(h.quantity)}
                                </TableCell>
                                <TableCell className="hidden text-right md:table-cell">
                                  {h.currency === "USD"
                                    ? `$${formatNumber(h.avg_price, 2)}`
                                    : formatKRW(h.avg_price)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {h.currency === "USD"
                                    ? `$${formatNumber(h.quantity * h.avg_price, 2)}`
                                    : formatKRW(h.quantity * h.avg_price)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-1">
                                    <HoldingDialog
                                      key={`edit-${h.id}`}
                                      accountId={account.id}
                                      holding={h}
                                      trigger={
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground"
                                          aria-label="종목 수정"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      }
                                    />
                                    <DeleteButton
                                      description={`"${h.name}" 종목이 삭제됩니다.`}
                                      onDelete={async () => {
                                        "use server";
                                        return deleteHolding(h.id);
                                      }}
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 코인 섹션 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="border-l-2 border-primary pl-3 text-sm font-semibold">코인</h2>
          <CoinHoldingDialog
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                코인 추가
              </Button>
            }
          />
        </div>

        {coinHoldings.length === 0 ? (
          <p className="text-sm text-muted-foreground">보유 코인을 추가해주세요.</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>코인</TableHead>
                    <TableHead className="hidden text-right md:table-cell">거래소</TableHead>
                    <TableHead className="hidden text-right md:table-cell">수량</TableHead>
                    <TableHead className="hidden text-right md:table-cell">평균단가</TableHead>
                    <TableHead className="text-right">매입금액</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coinHoldings.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.ticker}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-right md:table-cell">
                        {c.exchange}
                      </TableCell>
                      <TableCell className="hidden text-right md:table-cell">
                        {formatNumber(c.quantity, 8)}
                      </TableCell>
                      <TableCell className="hidden text-right md:table-cell">
                        {formatKRW(c.avg_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatKRW(c.quantity * c.avg_price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <CoinHoldingDialog
                            coin={c}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                aria-label="코인 수정"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DeleteButton
                            description={`"${c.name}" 코인이 삭제됩니다.`}
                            onDelete={async () => {
                              "use server";
                              return deleteCoinHolding(c.id);
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
