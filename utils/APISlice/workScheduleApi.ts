import { baseApi } from "./baseApi";

export const workScheduleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    getWorkSchedules: builder.query<any, void>({
      query: () => "/work-schedules",
      providesTags: ["WorkSchedule"],
    }),

    
    getUserWorkSchedules: builder.query<any, string>({
      query: (userId) => `/work-schedules/user/${userId}`,
      providesTags: ["WorkSchedule"],
    }),

    getWorkScheduleById: builder.query<any, string>({
      query: (scheduleId) => `/work-schedules/${scheduleId}`,
      providesTags: ["WorkSchedule"],
    }),

    createWorkSchedule: builder.mutation<any, any>({
      query: (body) => ({
        url: "/work-schedules",
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkSchedule"],
    }),

    updateWorkSchedule: builder.mutation<
      any,
      {
        scheduleId: string;
        body: any;
      }
    >({
      query: ({ scheduleId, body }) => ({
        url: `/work-schedules/${scheduleId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["WorkSchedule"],
    }),

    deleteWorkSchedule: builder.mutation<any, string>({
      query: (scheduleId) => ({
        url: `/work-schedules/${scheduleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WorkSchedule"],
    }),
  }),
});

export const {
  useGetWorkSchedulesQuery,
  useGetUserWorkSchedulesQuery,
  useGetWorkScheduleByIdQuery,
  useCreateWorkScheduleMutation,
  useUpdateWorkScheduleMutation,
  useDeleteWorkScheduleMutation,
} = workScheduleApi;