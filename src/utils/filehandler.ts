import { join } from 'path';
import { writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

export function saveFile(file: { originalname: string, buffer: Buffer }): string {
	// Generate a unique filename using UUID
	const uniqueFilename = `${uuidv4()}-${file.originalname}`;
	
	// Construct the file path
	const tempImagePath = join(process.cwd(), 'uploads', uniqueFilename);
	
	// Write the file buffer to the constructed file path
	writeFileSync(tempImagePath, file.buffer);
	
	// Return the unique filename
	return uniqueFilename;
}