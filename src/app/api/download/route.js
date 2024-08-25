import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { Utils } from '@/utils/urlshort';

const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'config', 'webrag.json'), // Update this path
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  }),
});

export const POST = async (req) => {
  try {
    const { fileId } = await req.json();
    const fileid=Utils(fileId);
    console.log(fileid)
    const timestamp = Date.now();
    const filePath = path.join(process.cwd(), 'temp', `document-${timestamp}.pdf`);
    const fileStream = fs.createWriteStream(filePath);

    const driveStream = await drive.files.get({
      fileId: fileid,
      alt: 'media',
    }, { responseType: 'stream' });

    driveStream.data.pipe(fileStream);

    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    return NextResponse.json({ message: 'File downloaded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
};
