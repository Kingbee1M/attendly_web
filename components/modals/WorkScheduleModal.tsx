"use client";

import { useEffect, useRef, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { toast } from "sonner";

import Input from "../../components/Input";
import { SVGLoader } from "../../components/SVGLoader";

import { useGetUsersParamsQuery } from "../../utils/APISlice/userApi";
import {
  useGetWorkSchedulesQuery,
  useCreateWorkScheduleMutation,
  useUpdateWorkScheduleMutation,
} from "../../utils/APISlice/workScheduleApi";

import { getErrorMessage } from "../../utils/getErrorMessage";

interface WorkScheduleModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type Target = "SINGLE" | "BULK";

const WorkScheduleModal = ({ isOpen, setIsOpen }: WorkScheduleModalProps) => {
  const { data: usersData, isLoading: usersLoading } = useGetUsersParamsQuery({
    page: 1,
    limit: 100,
  });
  const users = usersData?.data?.users || [];

  const { data: schedulesData } = useGetWorkSchedulesQuery();
  const schedules = schedulesData?.data?.data || [];

  const [createWorkSchedule, { isLoading: createLoading }] =
    useCreateWorkScheduleMutation();

  const [updateWorkSchedule, { isLoading: updateLoading }] =
    useUpdateWorkScheduleMutation();

  const isLoading = createLoading || updateLoading;

  const [target, setTarget] = useState<Target>("SINGLE");

  const [mode, setMode] = useState<"PRESENT" | "WFH">("PRESENT");
  const [officeDays, setOfficeDays] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Single-mode only
  const [userId, setUserId] = useState("");
  const [presentDays, setPresentDays] = useState<string[]>([]);
  const [wfhDays, setWfhDays] = useState<string[]>([]);
  const [presentId, setPresentId] = useState("");
  const [wfhId, setWfhId] = useState("");

  // Bulk-mode only
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const employeeBoxRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setUserId("");
    setPresentDays([]);
    setWfhDays([]);
    setPresentId("");
    setWfhId("");
    setSelectedUserIds([]);
    setOfficeDays([]);
    setEffectiveFrom("");
    setMode("PRESENT");
    setEmployeeSearch("");
    setShowDropdown(false);
  };

  const switchTarget = (next: Target) => {
    if (next === target) return;
    setTarget(next);
    resetForm();
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        employeeBoxRef.current &&
        !employeeBoxRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadEmployeeSchedule = (id: string, name: string) => {
    setUserId(id);
    setEmployeeSearch(name);
    setShowDropdown(false);

    const employeeSchedules = schedules.filter(
      (item: any) => item.userId === id
    );

    const present = employeeSchedules.find(
      (item: any) => item.workMode === "PRESENT"
    );
    const wfh = employeeSchedules.find(
      (item: any) => item.workMode === "WFH"
    );

    setPresentDays(present?.officeDays || []);
    setWfhDays(wfh?.officeDays || []);
    setPresentId(present?.id || "");
    setWfhId(wfh?.id || "");

    if (present?.effectiveFrom) {
      setEffectiveFrom(present.effectiveFrom.split("T")[0]);
    }
  };

  const toggleDay = (day: string) => {
    if (target === "BULK") {
      setOfficeDays((prev) =>
        prev.includes(day)
          ? prev.filter((item) => item !== day)
          : [...prev, day]
      );
      return;
    }

    if (mode === "PRESENT") {
      setPresentDays((prev) =>
        prev.includes(day)
          ? prev.filter((item) => item !== day)
          : [...prev, day]
      );
    } else {
      setWfhDays((prev) =>
        prev.includes(day)
          ? prev.filter((item) => item !== day)
          : [...prev, day]
      );
    }
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeUser = (id: string) => {
    setSelectedUserIds((prev) => prev.filter((item) => item !== id));
  };

  const filteredUsers = users.filter((user: any) =>
    user.name?.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((user: any) => selectedUserIds.includes(user.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredUsers.map((u: any) => u.id));
      setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const idsToAdd = filteredUsers
        .map((u: any) => u.id)
        .filter((id: string) => !selectedUserIds.includes(id));
      setSelectedUserIds((prev) => [...prev, ...idsToAdd]);
    }
  };

  const selectedUsers = users.filter((user: any) =>
    selectedUserIds.includes(user.id)
  );

  const activeDays = target === "BULK" ? officeDays : mode === "PRESENT" ? presentDays : wfhDays;

  const handleSubmit = async () => {
    if (target === "SINGLE") {
      if (!userId) {
        toast.error("Select employee");
        return;
      }

      const daysToSend = mode === "PRESENT" ? presentDays : wfhDays;

      if (daysToSend.length === 0) {
        toast.error("Select days");
        return;
      }

      const scheduleId = mode === "PRESENT" ? presentId : wfhId;

      const body = {
        userId,
        officeDays: daysToSend,
        workMode: mode,
        ...(effectiveFrom && {
          effectiveFrom: new Date(effectiveFrom).toISOString(),
        }),
      };

      try {
        if (scheduleId) {
          await updateWorkSchedule({ scheduleId, body }).unwrap();
          toast.success(`${mode} schedule updated`);
        } else {
          await createWorkSchedule(body).unwrap();
          toast.success(`${mode} schedule created`);
        }

        setIsOpen(false);
        resetForm();
      } catch (error: any) {
        toast.error(getErrorMessage(error, "Failed to save schedule"));
      }

      return;
    }

    // BULK
    if (selectedUserIds.length === 0) {
      toast.error("Select at least one employee");
      return;
    }

    if (officeDays.length === 0) {
      toast.error("Select days");
      return;
    }

    const body = {
      userIds: selectedUserIds,
      officeDays,
      workMode: mode,
      ...(effectiveFrom && {
        effectiveFrom: new Date(effectiveFrom).toISOString(),
      }),
    };

    try {
      await createWorkSchedule(body).unwrap();
      toast.success(
        `${mode} schedule saved for ${selectedUserIds.length} employee(s)`
      );

      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to save schedules"));
    }
  };

  const submitLabel = () => {
    if (target === "SINGLE") {
      return presentId || wfhId
        ? `Update ${mode} Schedule`
        : `Create ${mode} Schedule`;
    }

    const count = selectedUserIds.length || 0;
    return `Save ${mode} Schedule for ${count} Employee(s)`;
  };

  return (
    <div className="z-50">
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#00000051] z-40"
            onClick={() => {
              setIsOpen(false);
              resetForm();
            }}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white w-[700px] max-w-[95vw] rounded shadow-xl max-h-[90vh] flex flex-col">
              <div className="p-6 border border-gray-300 flex justify-between shrink-0">
                <h3 className="font-semibold text-lg">Work Schedule</h3>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                >
                  <AiOutlineClose size={20} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5 overflow-y-auto">
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  <button
                    className={`flex-1 py-3 transition-colors ${
                      target === "SINGLE"
                        ? "!bg-blue-600 !text-white"
                        : "!bg-white !text-black"
                    }`}
                    onClick={() => switchTarget("SINGLE")}
                  >
                    Single Employee
                  </button>

                  <button
                    className={`flex-1 py-3 transition-colors ${
                      target === "BULK"
                        ? "!bg-blue-600 !text-white"
                        : "!bg-white !text-black"
                    }`}
                    onClick={() => switchTarget("BULK")}
                  >
                    Bulk Employees
                  </button>
                </div>

                {target === "BULK" && (
                  <p className="text-sm text-gray-500">
                    Employees who already have a {mode} schedule will have it
                    updated; everyone else gets a new one.
                  </p>
                )}

                <label className="font-medium">
                  {target === "SINGLE" ? "Employee" : "Employees"}{" "}
                  {target === "BULK" && selectedUserIds.length > 0 && (
                    <span className="text-sm font-normal text-gray-500">
                      ({selectedUserIds.length} selected)
                    </span>
                  )}
                </label>

                <div className="relative" ref={employeeBoxRef}>
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      if (target === "SINGLE") {
                        setUserId("");
                      }
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={
                      usersLoading
                        ? "Loading..."
                        : target === "SINGLE"
                        ? "Search employee..."
                        : "Search employees..."
                    }
                    className="border border-gray-300 p-3 rounded w-full"
                  />

                  {showDropdown && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-[220px] overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">
                          No employees found
                        </div>
                      ) : target === "SINGLE" ? (
                        filteredUsers.map((user: any) => (
                          <div
                            key={user.id}
                            onClick={() =>
                              loadEmployeeSchedule(user.id, user.name)
                            }
                            className={`p-3 cursor-pointer hover:bg-blue-50 ${
                              userId === user.id ? "bg-blue-100" : ""
                            }`}
                          >
                            {user.name}
                          </div>
                        ))
                      ) : (
                        <>
                          <div
                            onClick={toggleSelectAllFiltered}
                            className="p-3 cursor-pointer hover:bg-blue-50 flex items-center gap-2 border-b border-gray-200 font-medium text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={allFilteredSelected}
                              readOnly
                              className="pointer-events-none"
                            />
                            {allFilteredSelected
                              ? "Deselect all"
                              : "Select all"}
                          </div>

                          {filteredUsers.map((user: any) => (
                            <div
                              key={user.id}
                              onClick={() => toggleUser(user.id)}
                              className={`p-3 cursor-pointer hover:bg-blue-50 flex items-center gap-2 ${
                                selectedUserIds.includes(user.id)
                                  ? "bg-blue-100"
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(user.id)}
                                readOnly
                                className="pointer-events-none"
                              />
                              {user.name}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {target === "BULK" && selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user: any) => (
                      <span
                        key={user.id}
                        className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-2.5 py-1 rounded-full"
                      >
                        {user.name}
                        <button
                          onClick={() => removeUser(user.id)}
                          className="hover:text-blue-900"
                        >
                          <AiOutlineClose size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex border border-gray-300 rounded overflow-hidden">
                  <button
                    className={`flex-1 py-3 transition-colors ${
                      mode === "PRESENT"
                        ? "!bg-blue-600 !text-white"
                        : "!bg-white !text-black"
                    }`}
                    onClick={() => setMode("PRESENT")}
                  >
                    PRESENT
                  </button>

                  <button
                    className={`flex-1 py-3 transition-colors ${
                      mode === "WFH"
                        ? "!bg-blue-600 !text-white"
                        : "!bg-white !text-black"
                    }`}
                    onClick={() => setMode("WFH")}
                  >
                    WFH
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`border border-gray-300 py-2 rounded transition-colors ${
                        activeDays.includes(day)
                          ? "!bg-blue-600 !text-white !border-blue-600"
                          : "!bg-white !text-black"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <Input
                  type="date"
                  value={effectiveFrom}
                  handleOnChange={(e) => setEffectiveFrom(e.target.value)}
                  label="Effective From"
                  placeholder="Effective From"
                />

                <button
                  disabled={isLoading}
                  onClick={handleSubmit}
                  className="btn_model_active w-full"
                >
                  {isLoading ? (
                    <SVGLoader width="30px" height="30px" color="#fff" />
                  ) : (
                    submitLabel()
                  )}
                </button>
              </div>

              <div className="p-6 flex justify-end shrink-0">
                <button
                  className="btn_model_outline"
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkScheduleModal;