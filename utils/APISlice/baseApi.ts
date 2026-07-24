import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "next-auth/react";

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    prepareHeaders: async (headers) => {
      const session: any = await getSession();

      if (session?.user?.token) {
        headers.set("Authorization", `Bearer ${session.user.token}`);
      }

      return headers;
    },
  }),
  tagTypes: [
    "Attendance",
    "User",
    "OfficeLocation",
    "Shift",
    "WorkSchedule",
    "LeaveRequest",
  ],
  endpoints: () => ({}),
});