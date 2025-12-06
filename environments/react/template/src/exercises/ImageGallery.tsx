/**
 * Image Gallery
 * 
 * Build a simple image gallery component that displays a list of images with titles. Users can add new images by providing a URL and title, and remove images by clicking a delete button.
 * 
 * Requirements:
 * - Display a form with two inputs: one for image URL and one for image title
 * - Include an 'Add Image' button that adds the image to the gallery
 * - Display all images in a grid or list format
 * - Each image should show the image itself and its title below it
 * - Each image should have a 'Delete' button that removes it from the gallery
 * - Start with an empty gallery (no default images)
 */

import { useState } from 'react'

function ImageGallery() {
  return (
    <div>
      <h2>Image Gallery</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
        {/* Your code here */}
      </div>
    </div>
  )
}

export default ImageGallery
