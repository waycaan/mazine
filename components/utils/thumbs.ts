/*
 * MIT License
 * 
 * Copyright (c) 2024 waycaan
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

export async function createPreviewImage(file: File, finalFileName: string): Promise<File> {  const previewBlob = await generatePreviewBlob(file)  return new File([previewBlob], `preview_${finalFileName}`, {    type: 'image/webp'  })}async function generatePreviewBlob(file: File): Promise<Blob> {  return new Promise((resolve, reject) => {    const img = new Image()    img.onload = () => {      const maxSize = 200      let width = img.width      let height = img.height      if (width > height) {        if (width > maxSize) {          height = Math.round((height * maxSize) / width)          width = maxSize        }      } else {        if (height > maxSize) {          width = Math.round((width * maxSize) / height)          height = maxSize        }      }      const canvas = document.createElement('canvas')      canvas.width = width      canvas.height = height      const ctx = canvas.getContext('2d')      if (!ctx) {        reject(new Error('Failed to get canvas context'))        return      }      ctx.drawImage(img, 0, 0, width, height)      canvas.toBlob(        (blob) => {          if (blob) {            resolve(blob)          } else {            reject(new Error('Failed to create thumb blob'))          }        },        'image/webp',        0.8       )    }    img.onerror = () => reject(new Error('Failed to load image for preview'))    img.src = URL.createObjectURL(file)  })}