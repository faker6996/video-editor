import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiApiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not found in environment variables' },
        { status: 500 }
      );
    }

    // Test 1: Check models endpoint
    const modelsResponse = await fetch(`${openaiApiBase}/models`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!modelsResponse.ok) {
      const errorData = await modelsResponse.text();
      return NextResponse.json(
        { 
          error: 'Failed to connect to OpenAI API',
          status: modelsResponse.status,
          details: errorData
        },
        { status: modelsResponse.status }
      );
    }

    const modelsData = await modelsResponse.json();
    
    // Test 2: Simple chat completion test
    const chatResponse = await fetch(`${openaiApiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Hello! This is a test message. Please respond with "API is working!"'
          }
        ],
        max_tokens: 10
      })
    });

    if (!chatResponse.ok) {
      const errorData = await chatResponse.text();
      return NextResponse.json(
        { 
          error: 'Chat completion test failed',
          status: chatResponse.status,
          details: errorData
        },
        { status: chatResponse.status }
      );
    }

    const chatData = await chatResponse.json();

    return NextResponse.json({
      success: true,
      message: 'OpenAI API is working correctly!',
      tests: {
        models: {
          status: 'success',
          availableModels: modelsData.data?.slice(0, 5).map((model: any) => model.id) || []
        },
        chatCompletion: {
          status: 'success',
          response: chatData.choices?.[0]?.message?.content || 'No response',
          model: chatData.model
        }
      },
      apiKey: `${openaiApiKey.substring(0, 10)}...${openaiApiKey.substring(openaiApiKey.length - 4)}` // Masked for security
    });

  } catch (error) {
    console.error('OpenAI API Test Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error while testing OpenAI API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for testing' },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiApiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not found' },
        { status: 500 }
      );
    }

    // Test with custom text
    const response = await fetch(`${openaiApiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSLATE_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Please summarize this text in one sentence: "${text}"`
          }
        ],
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { 
          error: 'OpenAI API call failed',
          status: response.status,
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      originalText: text,
      summary: data.choices?.[0]?.message?.content || 'No response',
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('OpenAI API Test Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}