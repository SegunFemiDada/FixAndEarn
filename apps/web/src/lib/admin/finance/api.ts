import { adminApi } from "@/lib/admin/api";
import type {
  ListWithdrawalsParams,
  ReviewWithdrawalPayload,
  ReviewWithdrawalResponse,
  WithdrawalDetail,
  WithdrawalEarningsTrace,
  WithdrawalListItem,
} from "@/lib/admin/finance/types";

export async function listWithdrawals(
  params: ListWithdrawalsParams = {}
): Promise<WithdrawalListItem[]> {
  const response = await adminApi.get<WithdrawalListItem[]>("/admin/finance/withdrawals", {
    params: {
      status: params.status,
      skip: params.skip ?? 0,
      take: params.take ?? 50,
    },
  });

  return response.data;
}

export async function getWithdrawal(id: string): Promise<WithdrawalDetail> {
  const response = await adminApi.get<WithdrawalDetail>(`/admin/finance/withdrawals/${id}`);
  return response.data;
}

export async function getWithdrawalEarningsTrace(id: string): Promise<WithdrawalEarningsTrace> {
  const response = await adminApi.get<WithdrawalEarningsTrace>(
    `/admin/finance/withdrawals/${id}/earnings-trace`
  );
  return response.data;
}

export async function approveWithdrawal(
  id: string,
  payload: ReviewWithdrawalPayload
): Promise<ReviewWithdrawalResponse> {
  const response = await adminApi.post<ReviewWithdrawalResponse>(
    `/admin/finance/withdrawals/${id}/approve`,
    payload
  );

  return response.data;
}

export async function rejectWithdrawal(
  id: string,
  payload: ReviewWithdrawalPayload
): Promise<ReviewWithdrawalResponse> {
  const response = await adminApi.post<ReviewWithdrawalResponse>(
    `/admin/finance/withdrawals/${id}/reject`,
    payload
  );

  return response.data;
}

export async function markWithdrawalPaid(
  id: string,
  payload: ReviewWithdrawalPayload
): Promise<ReviewWithdrawalResponse> {
  const response = await adminApi.post<ReviewWithdrawalResponse>(
    `/admin/finance/withdrawals/${id}/paid`,
    payload
  );

  return response.data;
}