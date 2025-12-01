/**
 * Character Counter
 * 
 * Create a text input that displays the character count as the user types. This combines controlled inputs with derived state - computing values based on existing state rather than storing everything separately.
 * 
 * Requirements:
 * - Use React.useState to manage the text input (starting as empty string)
 * - Render a text input that is controlled by the state
 * - Calculate the character count from the text length
 * - Display the count in the format: 'Character count: X'
 * - The count should update in real-time as the user types
 * - Export the CharacterCounter component as the default export
 */

import { useState } from 'react';

function CharacterCounter() {
  // TODO: Add state for text input
  const [text,setText] = useState("")
  const count = text.length
  
  return (
    <div>
      {/* TODO: Add controlled input and character count display */}
      <input type='text' value={text} onChange={(e)=>{setText(e.target.value)}}/>
      <p>Character count: {count}</p>
    </div>
  );
}

export default CharacterCounter;