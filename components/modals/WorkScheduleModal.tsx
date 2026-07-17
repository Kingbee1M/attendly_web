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

const WorkScheduleModal = ({ isOpen, setIsOpen }: WorkScheduleModalProps) => {
  // useGetUsersQuery has no params (fixed page-1 default). useGetUsersParamsQuery
  // accepts page/limit/search/etc., so we use that here with a high limit to
  // pull everyone in a single request for client-side filtering.
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

  const [mode, setMode] = useState<"PRESENT" | "WFH">("PRESENT");
  const [userId, setUserId] = useState("");
  const [presentDays, setPresentDays] = useState<string[]>([]);
  const [wfhDays, setWfhDays] = useState<string[]>([]);
  const [presentId, setPresentId] = useState("");
  const [wfhId, setWfhId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const employeeBoxRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setUserId("");
    setPresentDays([]);
    setWfhDays([]);
    setPresentId("");
    setWfhId("");
    setEffectiveFrom("");
    setMode("PRESENT");
    setEmployeeSearch("");
    setShowDropdown(false);
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

  const filteredUsers = users.filter((user: any) =>
    user.name?.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Select employee");
      return;
    }

    const officeDays = mode === "PRESENT" ? presentDays : wfhDays;

    if (officeDays.length === 0) {
      toast.error("Select days");
      return;
    }

    const scheduleId = mode === "PRESENT" ? presentId : wfhId;

    const body = {
      userId,
      officeDays,
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
            <div className="bg-white w-[700px] max-w-[95vw] rounded shadow-xl">
              <div className="p-6 border border-gray-300 flex justify-between">
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

              <div className="p-6 flex flex-col gap-5">
                <label className="font-medium">Employee</label>

                <div className="relative" ref={employeeBoxRef}>
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      setUserId("");
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={
                      usersLoading ? "Loading..." : "Search employee..."
                    }
                    className="border border-gray-300 p-3 rounded w-full"
                  />

                  {showDropdown && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-[220px] overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">
                          No employees found
                        </div>
                      ) : (
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
                      )}
                    </div>
                  )}
                </div>

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
                        (mode === "PRESENT" ? presentDays : wfhDays).includes(
                          day
                        )
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
                  ) : presentId || wfhId ? (
                    `Update ${mode} Schedule`
                  ) : (
                    `Create ${mode} Schedule`
                  )}
                </button>
              </div>

              <div className="p-6 flex justify-end">
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