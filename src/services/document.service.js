const crypto = require('crypto');
const path = require('path');

const env = require('../config/env');
const supabase = require('../config/supabase');

function safeFilename(originalName) {
  const parsed = path.parse(originalName || 'document');
  const base = parsed.name.replace(/[^\w.-]/g, '_') || 'document';
  const ext = parsed.ext.replace(/[^\w.]/g, '');
  return `${base}${ext}`;
}

function objectPathFor(file) {
  const unique = `${Date.now()}-${crypto.randomUUID()}`;
  return `transactions/${unique}-${safeFilename(file.originalname)}`;
}

async function uploadDocument(file) {
  if (!file) {
    return null;
  }

  const objectPath = objectPathFor(file);

  if (env.useMockData) {
    return `/documents/${path.basename(objectPath)}`;
  }

  const { error } = await supabase.storage
    .from(env.supabaseDocumentsBucket)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return objectPath;
}

function documentUrl(documentPath) {
  if (!documentPath) {
    return null;
  }

  if (documentPath.startsWith('/documents/') || /^https?:\/\//i.test(documentPath)) {
    return documentPath;
  }

  if (env.useMockData) {
    return `/documents/${path.basename(documentPath)}`;
  }

  const { data } = supabase.storage
    .from(env.supabaseDocumentsBucket)
    .getPublicUrl(documentPath);

  return data.publicUrl;
}

function documentName(documentPath) {
  if (!documentPath) {
    return null;
  }

  return path.basename(documentPath);
}

module.exports = {
  documentName,
  documentUrl,
  uploadDocument,
};
