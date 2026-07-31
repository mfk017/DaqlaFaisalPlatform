import fs from 'fs';
import { FormData, File } from 'formdata-node';
import { fileFromPathSync } from 'formdata-node/file-from-path';

async function run() {
  fs.writeFileSync('test.jpg', 'fake-image-content');
  
  const form = new FormData();
  form.append('action', 'return');
  form.append('next_stage_id', 'a');
  form.append('next_assignee_id', 'b');
  form.append('notes', 'test notes');
  form.append('image', fileFromPathSync('test.jpg'));

  // Get a valid session cookie from SQLite directly (or we can just mock the session)
  // Since we don't easily have a valid JWT cookie, maybe I can just read the server logs when the USER tests it.
}

run();
