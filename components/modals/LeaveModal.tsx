"use client";

import { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { toast } from "sonner";
import { SVGLoader } from "@/components/SVGLoader";
import {
  useGetLeaveRequestByIdQuery,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation,
} from "@/utils/APISlice/leaveApi";
import { getErrorMessage } from "@/utils/getErrorMessage";

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveId: string | null;
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString() : "-";

const LeaveModal = ({ isOpen, onClose, leaveId }: LeaveModalProps) => {
  const [mode, setMode] = useState<"VIEW" | "REJECT">("VIEW");
  const [reason, setReason] = useState("");

  const { data, isLoading, isError } = useGetLeaveRequestByIdQuery(
    leaveId as string,
    { skip: !isOpen || !leaveId }
  );

  const leave = data?.data?.data;

  const [approveLeaveRequest, { isLoading: approveLoading }] = useApproveLeaveRequestMutation();
  const [rejectLeaveRequest, { isLoading: rejectLoading }] = useRejectLeaveRequestMutation();

  const isSubmitting = approveLoading || rejectLoading;

  useEffect(() => {
    if (isOpen) {
      setMode("VIEW");
      setReason("");
    }
  }, [isOpen]);

  const handleClose = () => onClose();

  const handleApprove = async () => {
    try {
      await approveLeaveRequest(leaveId as string).unwrap();
      toast.success(`Approved leave for ${leave?.employee?.name}`);
      handleClose();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to approve leave request"));
    }
  };

  const handleReject = async () => {
    if (mode === "VIEW") {
      setMode("REJECT");
      return;
    }
    if (!reason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    try {
      await rejectLeaveRequest({
        leaveId: leaveId as string,
        rejectionReason: reason.trim(),
      }).unwrap();
      toast.success(`Rejected leave for ${leave?.employee?.name}`);
      handleClose();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to reject leave request"));
    }
  };

  if (!isOpen || !leaveId) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-md w-[500px] max-w-[95vw] shadow-xl">
          <div className="flex justify-between items-center border border-gray-300 p-5">
            <h2 className="font-semibold text-lg">
              {mode === "REJECT" ? "Reject Leave Request" : "Leave Details"}
            </h2>
            <button onClick={handleClose}><AiOutlineClose size={20} /></button>
          </div>

          {isLoading ? (
            <div className="p-10 flex justify-center"><SVGLoader width="30px" height="30px" color="#2563eb" /></div>
          ) : isError || !leave ? (
            <div className="p-10 text-center text-red-500 text-sm">Failed to load request.</div>
          ) : (
            <>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <h3 className="font-semibold">{leave.employee?.name}</h3>
                  <p className="text-sm text-gray-500">{leave.employee?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <h3>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</h3>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reason</p>
                  <p>{leave.reason || "-"}</p>
                </div>

                {mode === "REJECT" && (
                  <div>
                    <label className="block mb-2 font-medium">Rejection Reason</label>
                    <textarea
                      rows={4}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full border rounded p-3 outline-none"
                      placeholder="Enter rejection reason..."
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border border-gray-300 p-5">
                <button 
                  onClick={handleClose} 
                  disabled={isSubmitting} 
                  className="px-5 py-2 border border-gray-300"
                >
                  {mode === "REJECT" ? "Cancel" : "Close"}
                </button>

                {mode === "VIEW" && leave.status === "PENDING" && (
                  <>
                    <button
                      onClick={handleReject}
                      className="!bg-red-600 !text-white px-5 py-2 rounded"
                    >
                      Reject
                    </button>

                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="!bg-green-600 !text-white px-5 py-2 rounded"
                    >
                      {isSubmitting ? "Processing..." : "Approve"}
                    </button>
                  </>
                )}

                {mode === "REJECT" && (
                  <button 
                    onClick={handleReject} 
                    disabled={isSubmitting} 
                     className="!bg-red-600 !text-white px-5 py-2 rounded disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting..." : "Confirm Rejection"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LeaveModal;