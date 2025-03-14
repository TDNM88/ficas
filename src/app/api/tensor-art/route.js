import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { expireSec = 3600 } = await request.json();
    const apiKey = process.env.TENSOR_ART_API_KEY;

    const tensorResponse = await fetch('https://api.tensorart.com/v1/resource/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ expireSec })
    });

    if (!tensorResponse.ok) {
      const errorData = await tensorResponse.json();
      throw new Error(errorData.message || 'Lỗi từ Tensor Art API');
    }

    const { resourceId, putUrl, headers } = await tensorResponse.json();
    
    return NextResponse.json({
      success: true,
      resourceId,
      uploadUrl: putUrl,
      headers
    });

  } catch (error) {
    return NextResponse.json(
      { 
        code: 500,
        message: error.message,
        details: []
      },
      { status: 500 }
    );
  }
} 
