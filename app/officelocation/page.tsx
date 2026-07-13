"use client";
import React, { useEffect, useRef, useState } from 'react'
import { NoRecordFound, SVGLoaderFetch } from '@/components/Options'
import PageHeader from '@/components/PageHeader'
import Search from '@/components/Search'
import Image from "next/image";
import moment from "moment";
import OfficeLocationModal from '@/components/modals/OfficeLocationModal';
import ShiftModal from '@/components/modals/ShiftModal';
import { toast } from 'sonner';
import OfficeLocationUpdateModal from '@/components/modals/OfficeLocationUpdateModal';


import { useGetOfficeLocationsQuery, useAddOfficeLocationMutation, useUpdateOfficeLocationMutation } from '@/utils/APISlice/officeLocationApi';
import { useUserPrivileges } from '@/utils/userPrivileges';

const Attendance = () => {
	const { isSuperAdmin } = useUserPrivileges();
	const { data: officeData, isLoading } = useGetOfficeLocationsQuery();
	const [addOfficeLocation, { isSuccess: addSuccess }] = useAddOfficeLocationMutation();
	const [updateOfficeLocation, { isSuccess: updateSuccess }] = useUpdateOfficeLocationMutation();

	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [shiftModalOpen, setShiftModalOpen] = useState(false);
	const [selectedOfficeId, setSelectedOfficeId] = useState("");

	// Extract data from RTK Query response
	const officeLocations = officeData?.data?.data || officeData?.data || officeData || [];

	const dataToRender = Array.isArray(officeLocations)
		? officeLocations.filter((office: any) => {
			const query = searchQuery.toLowerCase();
			return (
				office.name?.toLowerCase().includes(query) ||
				office.address?.toLowerCase().includes(query) ||
				office.id?.toLowerCase().includes(query)
			);
		})
		: [];

	console.log("Office Locations", officeLocations);

	useEffect(() => {
		if (addSuccess) {
			toast.success("Office Locations Created!");
		} else if (updateSuccess) {
			toast.success("Office Locations Updated!");
		}
	}, [addSuccess, updateSuccess]);

	return (
		<div className='w-full'>
			<PageHeader text={"Office Location"} />

			<div className='flex flex-col md:flex-row justify-between gap-5 mt-6'>
				<Search
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search office location..."
				/>

				<div className='flex flex-col md:flex-row gap-5'>
					{isSuperAdmin && (
						<button className="flex flex-row justify-center items-center px-5 py-[8px] gap-2 !bg-[#2563EB] font-normal text-[14px] leading-[150%] text-[#FFFFFF] rounded-none"
							onClick={() => setIsOpen(true)}>
							Create Office
						</button>
					)}
				</div>

			</div>


			<div className="table-responsive-vertical mt-5">
				<div className="table-container">
					<table className="table">
						<thead>
							<tr>
								<th>Office ID</th>
								<th>Name</th>
								<th>Address</th>
								<th>Created At</th>
								<th>Updated At</th>
								<th>Manage Shifts</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<SVGLoaderFetch colSpan={6} />
							) : dataToRender?.length === 0 ? (
								<NoRecordFound colSpan={6} />
							) : (
								dataToRender?.map((office) => (
									<tr key={office.id}>
										<td data-title="Office ID">
											<button
												onClick={() => {
													navigator.clipboard.writeText(office.id);
													toast.success("Copied Office ID to clipboard");
												}}
												className="cursor-pointer flex flex-row justify-center items-center px-[6px] py-[4px] w-[70px] h-[22px] 
      border font-medium text-[12px] leading-[18px] 
      bg-[#EFF6FF] border-[#93C5FD] text-[#1D4ED8] hover:bg-[#DBEAFE] transition"
												title="Copy Office ID"
											>
												<span className="mr-1">Copy ID</span>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-3.5 w-3.5"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path d="M4 4a2 2 0 012-2h6a2 2 0 012 2v2h2a2 2 0 012 2v8a2 2 0 01-2 2h-6a2 2 0 01-2-2v-2H6a2 2 0 01-2-2V4z" />
												</svg>
											</button>
										</td>


										<td data-title="Name">{office.name}</td>
										<td data-title="Address">{office.address}</td>
										<td data-title="Created At">
											{moment(office.createdAt).format("YYYY-MM-DD HH:mm")}
										</td>
										<td data-title="Updated At">
											{moment(office.updatedAt).format("YYYY-MM-DD HH:mm")}
										</td>
										<td data-title="Updated At">
											<button
												className="flex flex-row justify-center items-center px-5 py-[8px] gap-2 !bg-[#2563EB] font-normal text-[14px] leading-[150%] text-[#FFFFFF] rounded-none"
												onClick={() => {
													console.log('Opening ShiftModal for office.id:', office.id);
													setSelectedOfficeId(office.id);
													setShiftModalOpen(true);
												}}
											>
												Manage Shifts
											</button>
										</td>
										<td data-title="Actions">
											<OfficeLocationUpdateModal id={office?.id} office={office} />
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			<OfficeLocationModal isOpen={isOpen} setIsOpen={setIsOpen} />
			{shiftModalOpen && (
				<ShiftModal
					isOpen={shiftModalOpen}
					setIsOpen={setShiftModalOpen}
					officeId={selectedOfficeId}
				/>
			)}
		</div>
	)
}

export default Attendance
