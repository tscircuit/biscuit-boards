import { BiscuitBoard } from "../lib/BiscuitBoard"

export default () => (
  <BiscuitBoard>
    <connector
      name="J_USB"
      standard="usb_c"
      footprint="jlcpcb:C456012"
      pcbX={10}
      pcbY={-23.75}
    />
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={6} pcbY={-17} />
    <led name="LED1" footprint="0603" pcbX={2} pcbY={-17} />
    <trace name="vbus_to_resistor" from=".J_USB > .VBUS1" to=".R1 > .pin1" />
    <trace name="resistor_to_led" from=".R1 > .pin2" to=".LED1 > .anode" />
    <trace name="led_to_ground" from=".LED1 > .cathode" to=".J_USB > .GND1" />
  </BiscuitBoard>
)
