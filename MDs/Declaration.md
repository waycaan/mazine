## Image Upload Restrictions

- **Vercel Free Plan Limitations**: Images larger than **4.5MB** cannot be uploaded.
- **Automatic WebP Conversion**:
  - Images larger than **4.4MB** are automatically converted to WebP format. If the size still exceeds the limit, the system will enforce compression, and in case of failure, an error will be reported.
  - If WebP conversion is not preferred, manual compression can be enabled. However, images exceeding **4.4MB** after manual compression will be considered as failed uploads.

## Upload Time Limitations

- **10-Second Limit**: Each upload session is restricted to a maximum of 10 seconds.
  - Uploading too many files at once or experiencing network delays may result in failure, with an `uploadserror` message displayed.
  - This limitation is due to Vercel's constraints, and failed files can be re-uploaded following the prompt.

## Traffic and Loading Information

- **Traffic Usage**: The upload process uses Vercel backend APIs, while image loading is handled via the client accessing the storage bucket (e.g., R2). There are no concerns about exceeding traffic limits for downloads.
- **Blur Preview and Loading Optimization**:
  - When loading images, the system prioritizes showing preview images from the `thumbs` folder (max size: 200px, WebP format). If no preview is available, the original image is loaded.
  - Original images can be previewed directly on the upload page, reducing caching pressure during normal operations.

## File Naming and Duplication Handling

- **Consistent File Extensions**: When WebP conversion is enabled, file extensions remain consistent with the source image, though the MIME type changes to WebP. This avoids duplication caused by identical file names but different formats.
- **Auto-Numbering for Duplicate Files**: Duplicate uploads will have sequential numbers appended to their file names (e.g., `logo_1.png`, `logo_2.png`).

## Application Features and Limitations

- **Single-User Design**: This application is designed for personal use and does not support multi-user scenarios. For multi-user setups, redeployment on Vercel is recommended.
- **Favorites Feature**:
  - Favorited images generate marker files in the storage bucket without occupying additional space.
  - A "Show Favorites" toggle is available on the management page (default off), allowing easy viewing and deletion of favorited images.
- **Upload and Download**:
  - Batch downloads are not supported; individual images can be downloaded via direct links. For batch downloads, tools like Alist are recommended.

## Data Security and Privacy

- **Database-Free**: This application does not use a database. Image data is stored in S3 and accessed via CDN, ensuring continued availability even if the webpage is inaccessible.
- **File Security**: Environment variables are stored in Vercel, and data access requires authorization. Image CDN links are independent of the webpage address, allowing free sharing of image URLs.

## Additional Information

- **Response Time**: After uploading or deleting images, metadata must be refreshed to maintain consistency. While constrained by Vercel and S3 limitations, response times are optimized as much as possible.
- **Compression Rate Configuration**:
  - Default compression is set to 0.85, with a WebP optimization rate of 0.9. You can adjust these settings in the following file:
    ```
    components/ImageUploader.tsx
    ```
    - Line 50: Adjust compression rate.
    - Line 74: Adjust WebP optimization rate.
    
- **Login Page Background**: The login page background can be customized by modifying the following line,
  Located in /app/login/page.tsx at line 18. Example:
  default background
  ```
  const [bgImage, setBgImage] = useState<string | null>('null')
  ```
  custom background
  ```
  const [bgImage, setBgImage] = useState<string | null>('https://example.com/background.png')
  ```

## Something I want to say:

### 1.Favorites Feature Design:
- The management page includes only "Favorites" and "Delete" functionalities. Favorited images are hidden by default and can be displayed using the showlikes toggle. A distinct UI style ensures users are reminded to avoid accidental deletion.
- Canceling favorites requires actions on the "Favorites Page," using multiple steps to confirm important operations.

### 2.Post-Upload Favorites:
- Images can be marked as favorites immediately after uploading. Users can undo this action right away, streamlining the process to align with practical usage habits.
  
