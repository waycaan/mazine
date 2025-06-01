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

import { ImageFile } from '@/types/image'export function getPublicUrl(fileName: string): string {  if (process.env.NEXT_PUBLIC_CDN) {    return `${process.env.NEXT_PUBLIC_CDN.replace(/\/$/, '')}/${fileName}`  }  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '')  const bucket = process.env.S3_BUCKET_NAME  return `${endpoint}/${bucket}/${fileName}`}export function separateImagesAndLikes(files: any[]): {  imageFiles: any[]  likedFiles: Set<string>} {  const likedFiles = new Set<string>()  const imageFiles = files.filter(item => {    const key = item.Key    if (key.startsWith('likes/')) {      likedFiles.add(key.replace('likes/', ''))      return false    }    return true  })  return { imageFiles, likedFiles }}export function processImageMetadata(file: any): ImageFile {  const fileName = file.Key  const url = getPublicUrl(fileName)  return {    originalName: fileName,    fileName,    url,    size: file.Size,    uploadTime: file.LastModified?.toISOString(),    markdown: `![${fileName}](${url})`,    bbcode: `[img]${url}[/img]`,    dimensions: {      width: 0,      height: 0    }  }}export function processImages(files: any[]): {  images: ImageFile[]  likedFiles: string[]} {  const { imageFiles, likedFiles } = separateImagesAndLikes(files)  const images = imageFiles.map(file => processImageMetadata(file))  return {    images,    likedFiles: Array.from(likedFiles)  }}export function transformImages(rawData: any) {  const { Contents = [] } = rawData;  const images = Contents.map((item: any) => ({    fileName: item.Key,    originalName: item.Key,    url: `/api/images/${encodeURIComponent(item.Key)}`,    markdown: `![${item.Key}](/api/images/${encodeURIComponent(item.Key)})`,    bbcode: `[img]/api/images/${encodeURIComponent(item.Key)}[/img]`,    uploadTime: item.LastModified,    size: item.Size,    isLiked: false  }));  return {    images,    likedFiles: []  };}