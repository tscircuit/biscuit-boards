import { TYPE_C_16P_QTWT } from "./imports/TYPE_C_16P_QTWT";

const Via = (props: { pcbX: number | string; pcbY: number | string }) => (
	<via
		netIsAssignable
		pcbX={props.pcbX}
		pcbY={props.pcbY}
		fromLayer={"top"}
		toLayer={"bottom"}
		holeDiameter={"0.2mm"}
		outerDiameter={"0.4mm"}
	/>
);

const VIA_SPACING = 1.2;
const ViaRow = (props: {
	viaCount: number;
	startX: number;
	startY: number;
	shouldSkip?: (index: number) => boolean;
	direction: "x+" | "x-" | "y+" | "y-";
	spacing?: number;
}) => (
	<>
		{Array.from({ length: props.viaCount })
			.map((_, index) =>
				props.shouldSkip ? (props.shouldSkip(index) ? null : index) : index,
			)
			.filter((index) => index !== null)
			.map((index) =>
				props.direction === "x+" ? (
					<Via
						pcbX={props.startX + index * (props.spacing ?? VIA_SPACING)}
						pcbY={props.startY}
					/>
				) : props.direction === "x-" ? (
					<Via
						pcbX={props.startX - index * (props.spacing ?? VIA_SPACING)}
						pcbY={props.startY}
					/>
				) : props.direction === "y+" ? (
					<Via
						pcbX={props.startX}
						pcbY={props.startY + index * (props.spacing ?? VIA_SPACING)}
					/>
				) : (
					<Via
						pcbX={props.startX}
						pcbY={props.startY - index * (props.spacing ?? VIA_SPACING)}
					/>
				),
			)}
	</>
);

export default () => (
	<board width="50mm" height="40mm">
		{/* <chip footprint="qfp80" name="U1" pcbX={-6} /> */}
		<net name="GND" />
		<copperpour
			connectsTo="net.GND"
			layer="top"
			coveredWithSolderMask
			name="PourTop"
		/>
		<copperpour
			connectsTo="net.GND"
			layer="bottom"
			coveredWithSolderMask
			name="PourBottom"
		/>
		<pcbnotedimension
			from={{ x: -25, y: 22 }}
			to={{ x: 25, y: 22 }}
			text="50mm"
		/>
		<pcbnotedimension
			from={{ x: 27, y: -20 }}
			to={{ x: 27, y: 20 }}
			text="40mm"
		/>
		{[-23, -21, 7, 10].map((x) => (
			<>
				<ViaRow
					shouldSkip={(index) => (Math.abs(x) === 21 ? index % 2 === 0 : false)}
					viaCount={4}
					startX={x}
					startY={18}
					direction="y-"
				/>
				<ViaRow
					viaCount={4}
					shouldSkip={(index) => (Math.abs(x) === 21 ? index % 2 === 0 : false)}
					startX={x}
					startY={12}
					direction="y-"
				/>
				<ViaRow
					shouldSkip={(index) => (Math.abs(x) === 21 ? index % 2 === 0 : false)}
					viaCount={4}
					startX={x}
					startY={0}
					direction="y-"
				/>
				<ViaRow
					shouldSkip={(index) => (Math.abs(x) === 21 ? index % 2 === 0 : false)}
					viaCount={4}
					startX={x}
					startY={-8}
					direction="y-"
				/>
				<ViaRow
					shouldSkip={(index) => (Math.abs(x) === 21 ? index % 2 === 0 : false)}
					viaCount={2}
					startX={x}
					startY={-16}
					direction="y-"
				/>
			</>
		))}
		<ViaRow viaCount={3} startX={0} startY={-17} direction="y+" />
		<ViaRow viaCount={9} startX={22.5} startY={18} direction="y-" spacing={2} />
		<ViaRow viaCount={9} startX={0} startY={17} direction="x-" spacing={2} />
		<ViaRow viaCount={4} startX={-13} startY={-11} spacing={2} direction="x+" />
		<TYPE_C_16P_QTWT
			name="J1"
			pcbX={-11}
			pcbY={-16}
			connections={{
				pin1: "net.GND",
				pin2: "net.GND",
				pin3: "net.GND",
				pin4: "net.GND",
				pin5: "net.GND",
				pin6: "net.GND",
				pin7: "net.GND",
				pin8: "net.GND",
				pin9: "net.GND",
				pin10: "net.GND",
				pin11: "net.GND",
				pin12: "net.GND",
				pin13: "net.GND",
				pin14: "net.GND",
				pin15: "net.GND",
				pin16: "net.GND",
			}}
		/>
	</board>
);
