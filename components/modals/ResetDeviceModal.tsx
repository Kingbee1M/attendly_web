"use client";

import { useEffect, useState } from "react";
import { SVGLoader } from "../SVGLoader";
import { AiOutlineClose } from "react-icons/ai";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useResetUserDeviceMutation } from "@/utils/APISlice/attendanceApi";
import { useGetUsersParamsQuery } from "@/utils/APISlice/userApi";
import { useGetOfficeLocationsQuery } from "@/utils/APISlice/officeLocationApi";
import CustomDropdownOffice from "../CustomDropdownOffice";
import { useUserPrivileges } from "@/utils/userPrivileges";

interface ResetDeviceModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ResetDeviceModal = ({ isOpen, setIsOpen }: ResetDeviceModalProps) => {
  const { user, isSuperAdmin } = useUserPrivileges();

  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const [resetUserDevice, { isLoading }] = useResetUserDeviceMutation();

  const { data: officeData, isLoading: isLoadingOffice } =
    useGetOfficeLocationsQuery(undefined, { skip: !isOpen });

  const locationOptions =
    officeData?.data?.data || officeData?.data || officeData || [];

  // Non-super-admins are locked to their own office, same as EmployeeDashBoard.
  const officeIdForQuery = isSuperAdmin
    ? selectedOfficeId
    : user?.officeId || "";

  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersParamsQuery(
    {
      page: 1,
      limit: 100,
      officeId: officeIdForQuery,
    },
    { skip: !isOpen || !officeIdForQuery },
  );

  const users =
    usersData?.data?.users ||
    usersData?.data?.data?.data ||
    usersData?.data?.data ||
    usersData?.data ||
    [];

  const usersToRender = Array.isArray(users) ? users : [];

  // Reset selections whenever the modal is opened fresh, and whenever
  // the office changes clear whichever user was picked for the old one.
  useEffect(() => {
    if (isOpen) {
      setSelectedOfficeId(isSuperAdmin ? "" : user?.officeId || "");
      setSelectedUserId("");
    }
  }, [isOpen, isSuperAdmin, user?.officeId]);

  useEffect(() => {
    setSelectedUserId("");
  }, [selectedOfficeId]);

  const close = () => {
    setIsOpen(false);
    setSelectedOfficeId("");
    setSelectedUserId("");
  };

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user.");
      return;
    }

    try {
      await resetUserDevice({ userId: selectedUserId }).unwrap();
      toast.success(
        "Device reset successfully. The user can bind a new device on their next clock-in.",
      );
      close();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to reset device"));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed !inset-0 bg-[#00000051] !bg-opacity-50 z-40"
        onClick={close}
      ></div>

      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
        <div className="bg-white w-[500px] max-w-[95vw] max-h-[90vh] rounded-[5px] flex flex-col shadow-xl relative">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 bg-white rounded-t-[32px]">
            <h3 className="text-lg font-semibold">Reset User Device</h3>
            <button
              className="text-gray-500 hover:text-gray-800 rounded-none"
              onClick={close}
            >
              <AiOutlineClose size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto min-h-7 flex flex-col gap-4">
            <p className="text-sm text-gray-500">
              This unbinds the selected user&apos;s device. Their next clock-in
              from any device will register that device as the new one. Use this
              when an employee has lost or replaced their phone.
            </p>

            {isSuperAdmin && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Office
                </label>
                <CustomDropdownOffice
                  label="Select an office"
                  options={locationOptions}
                  name="officeId"
                  handleOnChange={(_, value) => setSelectedOfficeId(value)}
                  loading={isLoadingOffice}
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Employee
              </label>

              {!officeIdForQuery ? (
                <div className="text-sm text-gray-400 border border-gray-200 rounded-none px-3 py-2">
                  {isSuperAdmin
                    ? "Select an office first"
                    : "No office found for your account"}
                </div>
              ) : isLoadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 border border-gray-200 rounded-none px-3 py-2">
                  <SVGLoader width="16px" height="16px" color="#94A3B8" />
                  Loading employees...
                </div>
              ) : usersToRender.length === 0 ? (
                <div className="text-sm text-gray-400 border border-gray-200 rounded-none px-3 py-2">
                  No employees found for this office
                </div>
              ) : (
                <select
                  className="w-full border border-gray-200 rounded-none px-3 py-2 text-sm text-gray-800 bg-white"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Select an employee</option>
                  {usersToRender.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.email ? `(${u.email})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end bg-white rounded-b-[32px]">
            <button onClick={close} className="btn_model_outline rounded-none">
              Cancel
            </button>
            <button
              className="btn_model_active ml-3 rounded-none"
              onClick={handleSubmit}
              disabled={isLoading || !selectedUserId}
            >
              {isLoading ? (
                <SVGLoader width="30px" height="30px" color="#FFF" />
              ) : (
                "Reset Device"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetDeviceModal;
