/**
 * Copyright 2024 waycaan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export default {
  common: {
    search: "Search",
    upload: "UPload",
    manage: "Manage",
    logout: "Logout",
    loading: "Loading...",
    confirm: "Confirm",
    cancel: "Cancel",
  },
  home: {
    dropzone: {
      title: "Click or drag images here to upload",
    },
    upload: {
      checking: "Checking files",
      processing: "Processing",
      uploading: "Uploading",
      complete: "Upload complete",
      compress: "Compressing",
      convert: "Converting",
      rename: "Renaming",
      errors: {
        title: 'Upload Failed List',
        invalidFileName: 'Invalid filename (cannot contain #, special characters or be too long), please rename and try again'
      }
    },
    options: {
      compress: "ZipZip",
      webp: "WebP",
    },
  },
  manage: {
    view: {
      grid: "Grid",
      timeline: "Timeline",
    },
    selection: {
      all: "ALL",
      none: "Clear",
      invert: "Invert",
      selected: "picked",
    },
    actions: {
      like: "Like !?",
      delete: "Delete",
      unlike: "UnLike",
      likeSelected: "Like Picked({count})",
      deleteSelected: "Delete Picked({count})",
      unlikeSelected: "UnLike Picked({count})"
    },
    filter: {
      showLiked: "Show Liked",
      search: "Search images...",
    },
    confirmLike: "Are you sure you want to like {count} selected images?",
    confirmDelete: "Are you sure you want to delete {count} selected images?",
    likeFailed: "Failed to like images",
    deleteFailed: "Failed to delete images",
    loading: "Loading...",
    noMore: "No more images",
    searchPlaceholder: "Search images..."
  },
  imageCard: {
    size: "Size",
    uploadTime: "UP-Time",
    dimensions: "Dimensions",
  },
  nav: {
    upload: "UPload",
    manage: "Manage",
    favorites: "LIKES",
    logout: "Logout",
    toggleTheme: "Toggle theme",
    backToTop: "Back to top"
  },
  likes: {
    loading: "Loading...",
    confirmUnlike: "Are you sure you want to unlike {count} selected images?",
    logoutFailed: "Logout failed",
    searchPlaceholder: "Search images...",
    loadMore: "Loading more...",
    noMore: "No more images",
    copyright: "© {year} Mazine by"
  },
  imageModal: {
    preview: "Preview image",
    close: "Close preview"
  },
  login: {
    title: "Mazine",
    subtitle: "-Where Amazing Meets Every spark-",
    password: "Enter access password",
    username: "imput Your Username",
    button: {
      login: "Login",
      loading: "Logging in..."
    },
    error: {
      failed: "Login failed",
      network: "Network error, please try again"
    },
    theme: "Toggle theme",
    copyright: "© {year} Mazine by"
  }
} 
