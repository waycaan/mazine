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

export interface ApiResponse {  success: boolean  error?: string  details?: string}export interface PaginatedResponse<T> extends ApiResponse {  data?: {    items: T[]    total: number    page: number    pageSize: number  }}export interface LoginRequest {  username: string  password: string}export interface LoginResponse extends ApiResponse {  data?: {    token: string    user: {      id: string      username: string    }  }}export interface UploadRequest {  file: File  onProgress?: (progress: number) => void}export interface DeleteRequest {  fileName: string}export interface BatchDeleteRequest {  fileNames: string[]}export interface BatchLikeRequest {  fileNames: string[]  like: boolean}