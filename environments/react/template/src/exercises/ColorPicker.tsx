/**
 * Color Picker
 * 
 * Create a simple RGB color picker using three range sliders. This exercise combines multiple controlled inputs, derived state (calculating the color string), and dynamic styling.
 * 
 * Requirements:
 * - Use React.useState to manage three separate numbers: red, green, and blue (each starting at 128)
 * - Render three range inputs (type='range') with min=0, max=255
 * - Each slider should be controlled by its respective state variable
 * - Display the current RGB values as text in the format: 'RGB(R, G, B)'
 * - Show a preview div with a background color that updates based on the RGB values
 * - The preview div should have a minimum height of 100px so it's visible
 * - Export the ColorPicker component as the default export
 */

import { useState } from 'react';

  const Slider = (
    {
      value,
      setter
    }:{
      value:number,
      setter:React.Dispatch<React.SetStateAction<number>>
  }) => {
    return (
      <input type="range" min={0} max={255} value={value} onChange={(e) => {setter(+e.currentTarget.value)}}/>
    )
  }
function ColorPicker() {
  // TODO: Add state for red, green, and blue values
  const [red,setRed] = useState(128)
  const [blue,setBlue]  = useState(128)
  const [green,setGreen] = useState(128)

  const rgbString = `rgb(${red},${green},${blue})`

  return (
    <div>
      {/* TODO: Add three range inputs for R, G, B */}
      {/* TODO: Display current RGB values as text */}
      {/* TODO: Add preview div with dynamic background color */}
      <Slider value={red} setter={setRed}/>
      <Slider value={blue} setter={setBlue}/>
      <Slider value={green} setter={setGreen}/>
      <p>RGB({red}, {green}, {blue})</p>
      <div style={{minHeight:100,backgroundColor:rgbString}}></div>
    </div>
  );
}

export default ColorPicker;