# Creat your bucket!
![R2-1.png](/MDs/R2-setting/R2-1.png)
![R2-2.png](/MDs/R2-setting/R2-2.png)

## Mark down 2 variables
- S3_REGION
- S3_BUCKET_NAME

---
## Get your R2 CDN

![R2-3.png](/MDs/R2-setting/R2-3.png)
![R2-4.png](/MDs/R2-setting/R2-4.png)

### R2.dev subdomain, you can use it as your NEXT_PUBLIC_CDN
---
![R2-5.png](/MDs/R2-setting/R2-5.png)
![R2-6.png](/MDs/R2-setting/R2-6.png)
![R2-7.png](/MDs/R2-setting/R2-7.png)
![2-8.png](/MDs/R2-setting/R2-8.png)

### custom domain, you can use it as your NEXT_PUBLIC_CDN
---

# You have 3 variables now,continued!

- S3_REGION
- S3_BUCKET_NAME
- NEXT_PUBLIC_CDN

## CORS policy rules
![R2-9.png](/MDs/R2-setting/R2-9.png)

```
[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]

```
![R2-9-1.png](/MDs/R2-setting/R2-9-1.png)
---

# manage your API tokens

## goback to the R2 overviewpage

![R2-11.png](/MDs/R2-setting/R2-11.png)
![R2-12.png](/MDs/R2-setting/R2-12.png)
![R2-13.png](/MDs/R2-setting/R2-13.png)
![R2-14.png](/MDs/R2-setting/R2-14.png)
![R2-15.png](/MDs/R2-setting/R2-15.png)
![R2-16.png](/MDs/R2-setting/R2-16.png)

# mark down the other 3 variables

- S3_SECRET_KEY
- S3_ACCESS_KEY
- S3_ENDPOINT

# now you have 6 variables! the rest part of variables are
- your password
- your language
