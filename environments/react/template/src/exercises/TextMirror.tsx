/**
 * Text Input Mirror
 * 
 * Create a component with a text input that displays (mirrors) whatever the user types in real-time. This introduces controlled components - one of React's most important patterns for form handling.
 * 
 * Requirements:
 * - Use React.useState to manage a 'text' state (starting as empty string '')
 * - Render an input element with type='text'
 * - The input's value should be controlled by the state (value={text})
 * - Add an onChange handler to update state when user types
 * - Display the current text value below the input in a paragraph
 * - Export the TextMirror component as the default export
 */

import { useState } from 'react';

function TextMirror() {
  // TODO: Add state for text
  const [text,setText] = useState<string>('')
  
  return (
    <div>
      {/* TODO: Add controlled input and display */}
      <input type='text' value={text} onChange={(e)=>{setText(e.currentTarget.value)}} />
      <p>{text}</p>
    </div>
  );
}

export default TextMirror;