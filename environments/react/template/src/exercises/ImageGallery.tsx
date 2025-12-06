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

type ImageElement = {id:number,url:string,title:string}
function ImageGallery() {
  const [url,setUrl] = useState("")
  const [title,setTitle] = useState("")
  const [imageList,setImageList] = useState<ImageElement[]>([])
  const [newId,setNewId] = useState(0)

  const addImage = () => {
    const newImage:ImageElement = {id:newId,url,title}
    setImageList(prev => [newImage,...prev])
    setUrl("")
    setTitle("")
    setNewId(prev => prev+1)
  }

  const removeImage = (id:number) => {
    setImageList(prev => {
      const newList:ImageElement[] = prev.filter(img => {
        return (img.id !== id)
      })
      return newList
    })
  }
  return (
    <div>
      <h2>Image Gallery</h2>
      <div>
        <label>Image URL: </label>
        <input value={url} onChange={(e)=>{setUrl(e.currentTarget.value)}}/>
      </div>
      <div>
        <label>Image Title: </label>
        <input value={title} onChange={(e)=>{setTitle(e.currentTarget.value)}}/>
      </div>
      <button onClick={addImage}>Add Image</button>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
        {/* Your code here */}
        {imageList.map(im => {
          return (
            <div key={im.id}>
              <img width="100" height="100" src={im.url}/>
              <p>{im.title}</p>
              <button onClick={() => {removeImage(im.id)}}>Delete</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ImageGallery
