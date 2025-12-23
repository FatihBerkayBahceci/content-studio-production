import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

interface RouteParams {
  params: { clientId: string };
}

// POST /api/clients/[clientId]/logo - Upload client logo
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { clientId } = params;
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Logo dosyası gerekli' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Sadece JPEG, PNG, WebP veya SVG dosyaları kabul edilir' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Dosya boyutu 5MB\'dan küçük olmalı' },
        { status: 400 }
      );
    }

    // Check if client exists
    const clients = await query('SELECT id, logo_url FROM clients WHERE id = ?', [clientId]);
    if (!Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    const client = clients[0];

    // Delete old logo if exists
    if (client.logo_url) {
      const oldPath = path.join(process.cwd(), 'public', client.logo_url);
      if (existsSync(oldPath)) {
        await unlink(oldPath);
      }
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `client-${clientId}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'clients');
    const filePath = path.join(uploadDir, filename);
    const publicUrl = `/uploads/clients/${filename}`;

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update database
    await query('UPDATE clients SET logo_url = ? WHERE id = ?', [publicUrl, clientId]);

    return NextResponse.json({
      success: true,
      logo_url: publicUrl,
      message: 'Logo başarıyla yüklendi'
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { success: false, error: 'Logo yüklenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[clientId]/logo - Remove client logo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { clientId } = params;

    // Get current logo
    const clients = await query('SELECT logo_url FROM clients WHERE id = ?', [clientId]);
    if (!Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    const client = clients[0];

    // Delete file if exists
    if (client.logo_url) {
      const filePath = path.join(process.cwd(), 'public', client.logo_url);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    }

    // Update database
    await query('UPDATE clients SET logo_url = NULL WHERE id = ?', [clientId]);

    return NextResponse.json({
      success: true,
      message: 'Logo başarıyla silindi'
    });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json(
      { success: false, error: 'Logo silinemedi' },
      { status: 500 }
    );
  }
}
