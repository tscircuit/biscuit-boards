import type { ChipProps } from "@tscircuit/props";

const pinLabels = {
	pin1: ["A12"],
	pin2: ["A9"],
	pin3: ["B5"],
	pin4: ["A8"],
	pin5: ["B6"],
	pin6: ["A7"],
	pin7: ["A6"],
	pin8: ["B7"],
	pin9: ["A5"],
	pin10: ["B8"],
	pin11: ["A4"],
	pin12: ["A1"],
	pin13: ["EH1"],
	pin14: ["EH2"],
	pin15: ["EH3"],
	pin16: ["EH4"],
} as const;

export const TYPE_C_16P_QTWT = (props: ChipProps<typeof pinLabels>) => {
	return (
		<chip
			pinLabels={pinLabels}
			supplierPartNumbers={{
				jlcpcb: ["C5187472"],
			}}
			manufacturerPartNumber="TYPE_C_16P_QTWT"
			footprint={
				<footprint>
					<hole
						pcbX="2.8898849999999356mm"
						pcbY="1.310976549999964mm"
						diameter="0.5999987999999999mm"
					/>
					<hole
						pcbX="-2.8901389999999765mm"
						pcbY="1.310976549999964mm"
						diameter="0.5999987999999999mm"
					/>
					<smtpad
						portHints={["pin1"]}
						pcbX="3.2000189999999975mm"
						pcbY="2.3983505499999183mm"
						width="0.49999899999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin2"]}
						pcbX="2.399919000000068mm"
						pcbY="2.3983505499999183mm"
						width="0.49999899999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin3"]}
						pcbX="1.7499329999999418mm"
						pcbY="2.3980965499998774mm"
						width="0.29999939999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin4"]}
						pcbX="1.2495529999999917mm"
						pcbY="2.399112549999927mm"
						width="0.29999939999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin5"]}
						pcbX="0.7499349999999367mm"
						pcbY="2.3980965499998774mm"
						width="0.29999939999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin6"]}
						pcbX="0.2498089999998001mm"
						pcbY="2.3980965499998774mm"
						width="0.29999939999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin7"]}
						pcbX="-0.2500629999999546mm"
						pcbY="2.3980965499998774mm"
						width="0.29999939999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin8"]}
						pcbX="-0.7501890000000913mm"
						pcbY="2.3980965499998774mm"
						width="0.29999939999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin9"]}
						pcbX="-1.2500610000000734mm"
						pcbY="2.3980965499998774mm"
						width="0.29999939999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin10"]}
						pcbX="-1.7501869999999826mm"
						pcbY="2.399112549999927mm"
						width="0.29999939999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin11"]}
						pcbX="-2.3999189999999544mm"
						pcbY="2.3983505499999183mm"
						width="0.49999899999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin12"]}
						pcbX="-3.2000189999999975mm"
						pcbY="2.3983505499999183mm"
						width="0.49999899999999997mm"
						height="1.1400028mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin13"]}
						pcbX="-5.200014999999894mm"
						pcbY="1.9810285499999054mm"
						width="1.6999966mm"
						height="1.1999975999999999mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin14"]}
						pcbX="5.200015000000008mm"
						pcbY="1.9810285499999054mm"
						width="1.6999966mm"
						height="1.1999975999999999mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin15"]}
						pcbX="-5.200014999999894mm"
						pcbY="-2.2191154500001176mm"
						width="1.6999966mm"
						height="1.499997mm"
						shape="rect"
					/>
					<smtpad
						portHints={["pin16"]}
						pcbX="5.200015000000008mm"
						pcbY="-2.2191154500001176mm"
						width="1.6999966mm"
						height="1.499997mm"
						shape="rect"
					/>
					<silkscreenpath
						route={[
							{ x: 0.019938999999908447, y: 1.2909867500000018 },
							{ x: 0.019938999999908447, y: -4.959013450000157 },
						]}
					/>
					<silkscreenpath
						route={[
							{ x: 3.189782799999989, y: 0.4908359500000188 },
							{ x: 3.189782799999989, y: -4.95914044999995 },
						]}
					/>
					<silkscreenpath
						route={[
							{ x: -3.210052000000019, y: 0.49098834999995233 },
							{ x: -3.210052000000019, y: -4.959013450000157 },
						]}
					/>
					<silkscreenpath
						route={[
							{ x: 4.479950400000007, y: -1.2378880500000378 },
							{ x: 4.479950400000007, y: 1.1509819499999594 },
						]}
					/>
					<silkscreenpath
						route={[
							{ x: -4.460036800000012, y: -3.2001650500001233 },
							{ x: -4.460036800000012, y: -4.959013450000157 },
							{ x: 4.479950400000007, y: -4.959013450000157 },
							{ x: 4.479950400000007, y: -3.2001650500001233 },
						]}
					/>
					<silkscreenpath
						route={[
							{ x: -4.460036800000012, y: 1.1498389499998893 },
							{ x: -4.460036800000012, y: -1.2378880500000378 },
						]}
					/>
				</footprint>
			}
			cadModel={{
				objUrl:
					"https://modelcdn.tscircuit.com/easyeda_models/download?uuid=6e649b1c1f3f40cf8579a842cb762744&pn=C5187472",
				rotationOffset: { x: 0, y: 0, z: 0 },
				positionOffset: {
					x: 0,
					y: 0,
					z: 1.5,
				},
			}}
			{...props}
		/>
	);
};
