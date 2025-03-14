import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const apiKey = process.env.TENSOR_ART_API_KEY;
    
    // Xử lý upload ảnh và mask lên Tensor Art
    const tensorResponse = await fetch('https://api.tensorart.com/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    });

    if (!tensorResponse.ok) {
      throw new Error(`Lỗi từ Tensor Art: ${tensorResponse.statusText}`);
    }

    const result = await tensorResponse.json();
    return NextResponse.json({ 
      url: result.outputUrl 
    });

  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
} 