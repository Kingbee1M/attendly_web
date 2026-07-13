import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);



const options = {
	responsive: true,
	maintainAspectRatio: false,
	cutout: '60%',
	plugins: {
		legend: {
			display: false
		},
		title: {
			display: false
		}
	}
};


const Chart = ({ earlyCount, lateCount }: { earlyCount?: number; lateCount?: number }) => {
	// Use 0 if earlyCount or lateCount are undefined
	const safeEarlyCount = earlyCount ?? 0;
	const safeLateCount = lateCount ?? 0;

	const data = {
		labels: ['Early', 'Late'],
		datasets: [{
			data: [safeEarlyCount, safeLateCount],
			backgroundColor: ['#2563EB', '#e8776f'],
			borderWidth: 1
		}]
	};

	return (
		<div className='p-6 flex flex-col justify-between h-full gap-6 items-center'>
			<div className='h-full md:h-[315px]'>
				<Doughnut data={data} options={options} />
			</div>
			<div className='flex flex-row items-center gap-6'>
				<div className='flex flex-row items-center gap-2'>
					<div className="w-[14px] h-[14px] bg-[#2563EB] rounded-[2px]"></div>
					<div className="font-montserrat font-medium text-[14px] leading-[18px] text-[#141414]">
						Early
					</div>
				</div>
				<div className='flex flex-row items-center gap-2'>
					<div className="w-[14px] h-[14px] bg-[#e8776f] rounded-[2px]"></div>
					<div className="font-montserrat font-medium text-[14px] leading-[18px] text-[#141414]">
						Late
					</div>
				</div>
			</div>
		</div>
	);
};

export default Chart;
