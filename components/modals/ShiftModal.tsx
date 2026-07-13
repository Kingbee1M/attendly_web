"use client";
import { useState, useEffect } from "react";
import Input from "../../components/Input";
import { SVGLoader } from "../../components/SVGLoader";
import {
 useGetShiftsByOfficeQuery,
 useAddShiftMutation,
 useUpdateShiftMutation,
 useDeleteShiftMutation,
 useAssignUserToShiftMutation,
} from "@/utils/APISlice/officeLocationApi";
import Dropdowns from "@/components/CustomDropdown";
import { useGetUsersParamsQuery } from "@/utils/APISlice/userApi";
import { AiOutlineClose } from "react-icons/ai";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { format24hTo12h, parse12hTo24h, generateTimeOptions } from "@/utils/timeUtils";

interface ShiftModalProps {
 isOpen: boolean;
 setIsOpen: (isOpen: boolean) => void;
 officeId: string;
}

const ShiftModal = ({ isOpen, setIsOpen, officeId }: ShiftModalProps) => {
 console.log('ShiftModal: officeId =', officeId, 'isOpen =', isOpen);
 const timeOptions = generateTimeOptions();
 const {
  data: shiftsData,
  isLoading: shiftsLoading,
  refetch: refetchShifts,
  error: shiftsError,
 } = useGetShiftsByOfficeQuery(officeId, { skip: !isOpen });
 const {
  data: usersData,
  isLoading: usersLoading,
  refetch: refetchUsers,
  error: usersError,
 } = useGetUsersParamsQuery(
  { officeId },
  { skip: !isOpen || !officeId }
 );
 console.log('ShiftModal: usersLoading =', usersLoading, 'usersError =', usersError, 'usersData =', usersData);
 const [addShift, { isLoading: addShiftLoading }] = useAddShiftMutation();
 const [updateShift, { isLoading: updateShiftLoading }] =
  useUpdateShiftMutation();
 const [deleteShift, { isLoading: deleteShiftLoading }] =
  useDeleteShiftMutation();
 const [assignUserToShift, { isLoading: assignLoading }] =
  useAssignUserToShiftMutation();

 const [shifts, setShifts] = useState<any[]>([]);
 const [users, setUsers] = useState<any[]>([]);
 // newShift and editingShiftData store 12-hour time for inputs
 const [newShift, setNewShift] = useState({
  name: "",
  startTime: "", // "08:00 AM"
  endTime: "",   // "05:00 PM"
 });
 const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
 const [editingShiftData, setEditingShiftData] = useState({
  name: "",
  startTime: "",
  endTime: "",
 });

 useEffect(() => {
  // Handle nested data structure: shiftsData.data.data
  const extractedShifts = Array.isArray(shiftsData)
   ? shiftsData
   : Array.isArray(shiftsData?.data?.data)
    ? shiftsData.data.data
    : Array.isArray(shiftsData?.data)
     ? shiftsData.data
     : [];
  setShifts(extractedShifts);

  // Handle nested user data structure (usersData.data.data.users)
  console.log('usersData:', usersData);
  const extractedUsers = Array.isArray(usersData?.data?.data?.users)
   ? usersData.data.data.users
   : Array.isArray(usersData?.data?.users)
    ? usersData.data.users
    : Array.isArray(usersData?.data?.data)
     ? usersData.data.data
     : Array.isArray(usersData?.data)
      ? usersData.data
      : [];
  setUsers(extractedUsers);
 }, [shiftsData, usersData]);

 useEffect(() => {
  if (!isOpen) {
   setNewShift({ name: "", startTime: "", endTime: "" });
   setEditingShiftId(null);
   setEditingShiftData({ name: "", startTime: "", endTime: "" });
  }
 }, [isOpen]);

 const handleAddShift = async () => {
  try {
   await addShift({
    ...newShift,
    officeId,
    startTime: parse12hTo24h(newShift.startTime),
    endTime: parse12hTo24h(newShift.endTime),
   }).unwrap();
   setNewShift({ name: "", startTime: "", endTime: "" });
   refetchShifts();
   toast.success("Shift added successfully!");
  } catch (error: any) {
   toast.error(getErrorMessage(error, "Failed to add shift"));
  }
 };

 const handleUpdateShift = async () => {
  if (!editingShiftId) return;
  try {
   await updateShift({
    id: editingShiftId,
    ...editingShiftData,
    startTime: parse12hTo24h(editingShiftData.startTime),
    endTime: parse12hTo24h(editingShiftData.endTime),
   }).unwrap();
   setEditingShiftId(null);
   setEditingShiftData({ name: "", startTime: "", endTime: "" });
   refetchShifts();
   toast.success("Shift updated successfully!");
  } catch (error: any) {
   toast.error(getErrorMessage(error, "Failed to update shift"));
  }
 };

 const handleDeleteShift = async (shiftId: string) => {
  try {
   await deleteShift(shiftId).unwrap();
   refetchShifts();
   toast.success("Shift deleted successfully!");
  } catch (error: any) {
   toast.error(getErrorMessage(error, "Failed to delete shift"));
  }
 };

 const handleAssignUser = async (userId: string, shiftId: string) => {
  try {
   await assignUserToShift({ userId, shiftId }).unwrap();
   refetchShifts();
   refetchUsers();
   toast.success("User assigned to shift successfully!");
  } catch (error: any) {
   toast.error(getErrorMessage(error, "Failed to assign user"));
  }
 };

 return (
  <div className="z-50 h-full">
   {isOpen && (
    <>
     <div
      className="fixed !inset-0 bg-[#00000051] !bg-opacity-50 z-40"
      onClick={() => setIsOpen(false)}
     ></div>

     <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white w-[900px] max-w-[95vw] max-h-[90vh] rounded-[5px] flex flex-col shadow-xl relative">
       <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 bg-white rounded-t-[32px]">
        <h3 className="text-lg font-semibold">Manage Shifts</h3>
        <button
         className="text-gray-500 hover:text-gray-800 rounded-none"
         onClick={() => setIsOpen(false)}
        >
         <AiOutlineClose size={20} />
        </button>
       </div>

       <div className="p-6 overflow-y-auto flex flex-col gap-6">
        {/* Add New Shift */}
        <div className="border border-gray-200 rounded p-4">
         <h4 className="font-medium mb-4">Add New Shift</h4>
         <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-1">
           <Input
            type="text"
            value={newShift.name}
            handleOnChange={(e) =>
             setNewShift({ ...newShift, name: e.target.value })
            }
            label="Shift Name"
            placeholder="e.g. Morning Shift"
           />
          </div>
          {/* Start Time Dropdown */}
          <div className="md:col-span-2">
           <Dropdowns
            label="Start Time"
            options={timeOptions}
            name="startTimeAdd"
            value={newShift.startTime}
            handleOnChange={(_name, value) => {
             setNewShift({ ...newShift, startTime: value });
            }}
           />
          </div>
          {/* End Time Dropdown */}
          <div className="md:col-span-2">
           <Dropdowns
            label="End Time"
            options={timeOptions}
            name="endTimeAdd"
            value={newShift.endTime}
            handleOnChange={(_name, value) => {
             setNewShift({ ...newShift, endTime: value });
            }}
           />
          </div>
         </div>
         <button
          className="btn_model_active mt-4 rounded-none"
          onClick={handleAddShift}
          disabled={addShiftLoading}
         >
          {addShiftLoading ? (
           <SVGLoader width="20px" height="20px" color="#FFF" />
          ) : (
           "Add Shift"
          )}
         </button>
        </div>

        {/* Shifts List */}
        <div>
         <h4 className="font-medium mb-4">Existing Shifts</h4>
         {shiftsLoading ? (
          <div className="flex justify-center">
           <SVGLoader width="30px" height="30px" />
          </div>
         ) : shifts.length === 0 ? (
          <p className="text-gray-500 text-center w-full">No shifts found</p>
         ) : (
          <div className="space-y-4">
           {shifts.map((shift) => (
            <div
             key={shift.id}
             className="border border-gray-200 p-4"
            >
             {editingShiftId === shift.id ? (
              <>
               <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 items-end">
                <div className="md:col-span-1">
                 <Input
                  type="text"
                  value={editingShiftData.name}
                  handleOnChange={(e) =>
                   setEditingShiftData({
                    ...editingShiftData,
                    name: e.target.value,
                   })
                  }
                  label="Shift Name"
                 />
                </div>
                {/* Start Time Dropdown for Editing */}
                <div className="md:col-span-2">
                 <Dropdowns
                  label="Start Time"
                  options={timeOptions}
                  name="startTimeEdit"
                  value={editingShiftData.startTime}
                  handleOnChange={(_name, value) => {
                   setEditingShiftData({ ...editingShiftData, startTime: value });
                  }}
                 />
                </div>
                {/* End Time Dropdown for Editing */}
                <div className="md:col-span-2">
                 <Dropdowns
                  label="End Time"
                  options={timeOptions}
                  name="endTimeEdit"
                  value={editingShiftData.endTime}
                  handleOnChange={(_name, value) => {
                   setEditingShiftData({ ...editingShiftData, endTime: value });
                  }}
                 />
                </div>
               </div>
               <div className="flex gap-2">
                <button
                 className="btn_model_active rounded-none"
                 onClick={handleUpdateShift}
                 disabled={updateShiftLoading}
                >
                 {updateShiftLoading ? (
                  <SVGLoader
                   width="20px"
                   height="20px"
                   color="#FFF"
                  />
                 ) : (
                  "Save"
                 )}
                </button>
                <button
                 className="btn_model_outline rounded-none"
                 onClick={() => {
                  setEditingShiftId(null);
                  setEditingShiftData({
                   name: "",
                   startTime: "",
                   endTime: "",
                  });
                 }}
                >
                 Cancel
                </button>
               </div>
              </>
             ) : (
              <>
               <div className="flex justify-between items-start">
                <div>
                 <h5 className="font-medium">{shift.name}</h5>
                 <p className="text-sm text-gray-500">
                  {format24hTo12h(shift.startTime)} - {format24hTo12h(shift.endTime)}
                 </p>
                </div>
                <div className="flex gap-2">
                 <button
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  onClick={() => {
                   setEditingShiftId(shift.id);
                   setEditingShiftData({
                    name: shift.name,
                    startTime: format24hTo12h(shift.startTime),
                    endTime: format24hTo12h(shift.endTime),
                   });
                  }}
                 >
                  Edit
                 </button>
                 <button
                  className="text-red-600 hover:text-red-800 text-sm"
                  onClick={() => handleDeleteShift(shift.id)}
                  disabled={deleteShiftLoading}
                 >
                  Delete
                 </button>
                </div>
               </div>

               {/* Assign Users */}
               <div className="mt-4">
                <h6 className="text-sm font-medium mb-2">
                 Assign Users:
                </h6>
                {usersLoading ? (
                 <div className="flex justify-center">
                  <SVGLoader width="20px" height="20px" />
                 </div>
                ) : users.length === 0 ? (
                 <p className="text-sm text-gray-500">
                  No users found for this office
                 </p>
                ) : (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {users.map((user) => (
                   <div
                    key={user.id}
                    className={`flex items-center justify-between p-2 border rounded ${user.shiftId === shift.id
                     ? "border-blue-500 bg-blue-50"
                     : "border-gray-200"
                     }`}
                   >
                    <span className="text-sm">
                     {user.name}
                    </span>
                    {user.shiftId === shift.id ? (
                     <span className="text-xs text-green-600">
                      Assigned
                     </span>
                    ) : (
                     <button
                      className="text-xs text-blue-600 hover:text-blue-800"
                      onClick={() =>
                       handleAssignUser(user.id, shift.id)
                      }
                      disabled={assignLoading}
                     >
                      Assign
                     </button>
                    )}
                   </div>
                  ))}
                 </div>
                )}
               </div>
              </>
             )}
            </div>
           ))}
          </div>
         )}
        </div>
       </div>

       <div className="p-6 border-t border-gray-100 flex justify-end bg-white rounded-b-[32px]">
        <button
         onClick={() => setIsOpen(false)}
         className="btn_model_outline rounded-none"
        >
         Close
        </button>
       </div>
      </div>
     </div>
    </>
   )}
  </div>
 );
};

export default ShiftModal;
