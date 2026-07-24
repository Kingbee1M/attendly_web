"use client";

import { useState } from "react";
import { FiEye } from "react-icons/fi";

import PageHeader from "@/components/PageHeader";
import Search from "@/components/Search";
import { SVGLoader } from "@/components/SVGLoader";
import LeaveModal from "@/components/modals/LeaveModal";

import { useGetLeaveRequestsQuery } from "@/utils/APISlice/leaveApi";

const LIMIT = 10;

type ModalState = {
  leaveId: string;
} | null;

export default function LeaveRequests() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<ModalState>(null);

  const { data, isLoading, isFetching, isError } = useGetLeaveRequestsQuery({
    page,
    limit: LIMIT,
    search,
  });

  const paginated = data?.data?.data;
  const leaves = paginated?.data ?? [];
  const totalPages = paginated?.pages ?? 1;

  const badge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700 border border-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-700 border border-red-300";
      default:
        return "bg-yellow-100 text-yellow-700 border border-yellow-300";
    }
  };

  const handleSearchChange = (e: any) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openModal = (leaveId: string) => {
    setModalState({ leaveId });
  };

  const closeModal = () => setModalState(null);

  return (
    <div className="w-full">
      <PageHeader text="Leave Requests" />

      <div className="flex justify-between mt-6 mb-5">
        <Search
          value={search}
          onChange={handleSearchChange}
          placeholder="Search employee..."
        />
      </div>

      <div className="table-responsive-vertical">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Leave Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <div className="flex justify-center">
                      <SVGLoader width="30px" height="30px" color="#2563eb" />
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-red-500">
                    Failed to load leave requests.
                  </td>
                </tr>
              ) : (
                <>
                  {leaves.map((leave: any) => (
                    <tr key={leave.id}>
                      <td>{leave.employee?.name}</td>
                      <td>{leave.employee?.email}</td>
                      <td>{leave.leaveType}</td>
                      <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td>{leave.reason || "-"}</td>
                      <td>
                        <span className={`px-3 py-1  text-xs font-medium ${badge(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => openModal(leave.id)}
                          className="inline-flex items-center justify-center w-9 h-9  transition"
                          title="View Leave Request"
                        >
                          <FiEye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8">No leave requests found.</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination component remains exactly the same */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex justify-end items-center gap-3 mt-4">
          <button
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <LeaveModal
        isOpen={modalState !== null}
        onClose={closeModal}
        leaveId={modalState?.leaveId ?? null}
      />
    </div>
  );
}