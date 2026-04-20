const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3");

const DEFAULT_EXPIRES_SECONDS = 60 * 60 * 24 * 7; // 7 days (max for S3 signed URLs)

const isHttpUrl = (value) => /^https?:\/\//i.test(value || "");

const extractKeyFromUrl = (url) => {
  try {
    const parsed = new URL(url);
    const bucket = process.env.AWS_BUCKET_NAME;
    if (!bucket) return "";

    const host = parsed.hostname || "";
    const path = (parsed.pathname || "").replace(/^\/+/, "");

    // Virtual-hosted–style: https://bucket.s3.region.amazonaws.com/key
    if (host.startsWith(`${bucket}.`)) {
      return path;
    }

    // Path-style: https://s3.region.amazonaws.com/bucket/key
    if (path.toLowerCase().startsWith(bucket.toLowerCase() + "/")) {
      return path.substring(bucket.length + 1);
    }

    return "";
  } catch {
    return "";
  }
};

const getSignedUrlForKey = async (key, expiresInSeconds = DEFAULT_EXPIRES_SECONDS) => {
  if (!key) return "";
  if (isHttpUrl(key)) {
    const extractedKey = extractKeyFromUrl(key);
    if (!extractedKey) return key;
    key = extractedKey;
  }
  if (!process.env.AWS_BUCKET_NAME) return "";

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
};

const getSignedReadUrl = (key, expiresInSeconds = DEFAULT_EXPIRES_SECONDS) =>
  getSignedUrlForKey(key, expiresInSeconds);

module.exports = { getSignedUrlForKey, getSignedReadUrl };
