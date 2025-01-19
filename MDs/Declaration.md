## Declaration

### Image Upload Limitations
- **Vercel Free Plan Restrictions**: Due to Vercel's Free Plan resource limitations, images larger than **4.5MB** cannot be uploaded.
- **Automatic WebP Conversion**: When uploading images larger than **4.4MB**, the system will automatically convert the image to WebP format.
  - If you do not wish to convert to WebP, you can enable the compression feature to compress the image yourself.
  - If the image is still larger than 4.4MB after compression, it will be automatically marked as an upload failure.

### Upload Time Limitation
- **10-Second Upload Time**: Vercel's Free Plan limits each upload to 10 seconds.
  - If there are too many files or network congestion, the upload may fail, and the page will display an `uploadserror` prompt.
  - This issue is due to Vercel's limitations, not a problem with the code. Failed files can be re-uploaded based on the prompt.

### Data Usage Instructions
- During upload, the backend API of Vercel's server is called, while image loading and other operations are handled directly by the client via access to the storage bucket (e.g., R2).
- Tests have shown that download traffic is directly accessed by the browser from the storage bucket, so there is no need to worry about exceeding traffic limits.

### Image Loading and Blurry Preview
- **Blurring**: When loading images in the `imagecard`, the system will prioritize fetching preview images from the `thumbs` folder (maximum size of 200, in WebP format).
  - If no preview image is available, the original image will be loaded.
- **File Extension Consistency**: When the WebP conversion feature is enabled, the generated file extension will remain the same as the source image, but the file format will be WebP.
  - This is to avoid conflicts between files with the same name but different formats; when uploading a file with the same name, the system will automatically add a number to the new file.

### Application Features and Limitations
- **Single User Design**: This image hosting service is designed for individual use and does not support multi-user scenarios. If multi-user access is needed, it is recommended to redeploy on Vercel.
- **Upload and Download**:
  - The image hosting service is for uploading images only and does not provide bulk download functionality. Users can download images individually via direct links.
  - For bulk downloads, it is recommended to use Alist for unified management.
- **Bookmarking Functionality**:
  - The system will create a `likes` folder in the storage bucket to store bookmark marker files for favorite images (does not take up space).
  - The management page has a "Display Bookmarked Images" toggle (default off). When enabled, users can directly delete bookmarked images.
  - The bookmark page does not provide a delete function; it is designed for quickly finding frequently used images.

### Data Security
- **No Database Dependency**: This application does not use a database. All image data is linked through CDN and stored in S3.
  - Even if the page is compromised or fails, images will still be accessible. After redeploying, the page functionality remains the same.
- **File Renaming**: S3 does not support renaming files; it only supports overwriting operations.
  - Files with duplicate names will automatically have a number appended.
  - Files with `#` in the name are not supported for upload, but long and complex file names will display correctly.

### Additional Notes
- **Not an S3 Manager**: This application is an image hosting service, not an S3 file manager. If you need to manage other file types such as videos or documents, it is recommended to use Alist.
- **Response Speed**: After uploading or deleting images, all image metadata needs to be refreshed for consistency. The response speed has been optimized as much as possible, but is still influenced by Vercel and S3 limitations.