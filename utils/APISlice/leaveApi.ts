import { baseApi } from "./baseApi";

export type LeaveRequestFilters = {
  page?: number;
  limit?: number;
  status?: string;
  leaveType?: string;
  search?: string;
  officeId?: string;
};

const buildQueryString = (params: Record<string, any> = {}) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return query ? `?${query}` : "";
};

export const leaveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaveRequests: builder.query<any, LeaveRequestFilters | void>({
      query: (filters) => `/leave${buildQueryString(filters || {})}`,
      providesTags: ["LeaveRequest"],
    }),

    getMyLeaveRequests: builder.query<any, void>({
      query: () => "/leave/my",
      providesTags: ["LeaveRequest"],
    }),

    getLeaveRequestById: builder.query<any, string>({
      query: (leaveId) => `/leave/${leaveId}`,
      providesTags: ["LeaveRequest"],
    }),

    createLeaveRequest: builder.mutation<any, any>({
      query: (body) => ({
        url: "/leave",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LeaveRequest"],
    }),

    approveLeaveRequest: builder.mutation<any, string>({
      query: (leaveId) => ({
        url: `/leave/${leaveId}/approve`,
        method: "PUT",
      }),
      invalidatesTags: ["LeaveRequest"],
    }),

    rejectLeaveRequest: builder.mutation<
      any,
      { leaveId: string; rejectionReason: string }
    >({
      query: ({ leaveId, rejectionReason }) => ({
        url: `/leave/${leaveId}/reject`,
        method: "PUT",
        body: { rejectionReason },
      }),
      invalidatesTags: ["LeaveRequest"],
    }),
  }),
});

export const {
  useGetLeaveRequestsQuery,
  useGetMyLeaveRequestsQuery,
  useGetLeaveRequestByIdQuery,
  useCreateLeaveRequestMutation,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation,
} = leaveApi;