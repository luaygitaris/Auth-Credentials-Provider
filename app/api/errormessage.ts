// pages/api/error-message.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { error } = req.query;

  if (error) {
    // Kirim pesan error sebagai JSON
    return res.status(200).json({ error: String(error) });
  }

  // Jika tidak ada error, kirim response kosong
  return res.status(200).json({});
}
