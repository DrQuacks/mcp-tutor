/**
 * Toggle Visibility
 * 
 * Create a component that toggles the visibility of content when a button is clicked. This exercise teaches conditional rendering in React - one of the most fundamental concepts for building interactive UIs.
 * 
 * Requirements:
 * - Use React.useState hook to manage a boolean 'isVisible' state (starting as false)
 * - Render a button with text 'Toggle' that changes the state when clicked
 * - When isVisible is true, display a paragraph with the text 'Hello, I am visible!'
 * - When isVisible is false, the paragraph should not be rendered at all
 * - Export the ToggleVisibility component as the default export
 */

import { useState } from 'react';

function ToggleVisibility() {
  // TODO: Add boolean state for visibility
  const [isVisible,setIsVisible] = useState<boolean>(false)
  
  return (
    <div>
      {/* TODO: Add toggle button and conditional content */}
      <button onClick={()=>{setIsVisible(prev=>!prev)}}>Toggle</button>
      {isVisible && <p>Hello, I am visible!</p>}
    </div>
  );
}

export default ToggleVisibility;